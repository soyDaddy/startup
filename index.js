const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const axios = require('axios');
const simpleGit = require('simple-git');
const inquirer = require('inquirer');
const fsExtra = require('fs-extra');
const configPath = path.resolve(__dirname, 'config.json');
const localesDir = path.resolve(__dirname, 'locales');
let allowedPackages = [];

function loadYAMLFile(language, fileType) {
  const filePath = path.resolve(localesDir, language, `${fileType}.yml`);
  try {
    return yaml.load(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error(`Error loading ${fileType} file for language '${language}':`, error);
    process.exit(1);
  }
}

async function fetchAllowedPackages() {
  const apiURL = 'https://api.omenlist.xyz/version/check';
  try {
    const response = await axios.get(apiURL);
    allowedPackages = response.data.map(package => package.name);
    return allowedPackages;
  } catch (error) {
    console.error('Error fetching allowed packages from API:', error);
    process.exit(1);
  }
}

async function askForPackageSelection(messages) {
  if (!allowedPackages.length) {
    await fetchAllowedPackages();
  }

  const question = [
    {
      type: 'list',
      name: 'packageName',
      message: messages.selectPackage,
      choices: allowedPackages,
    },
  ];

  const answer = await inquirer.prompt(question);
  return answer.packageName;
}

class Startup {
  constructor(packageName, version, language = 'en') {
    this.language = language;
    this.messages = loadYAMLFile(this.language, 'messages') || loadYAMLFile('en', 'messages');
    this.errors = loadYAMLFile(this.language, 'errors') || loadYAMLFile('en', 'errors');

    fetchAllowedPackages().then(() => {
      if (!allowedPackages.includes(packageName)) {
        askForPackageSelection(this.messages).then(selectedPackage => {
          this.packageName = selectedPackage;
          this.version = version;
          this.initialize();
        });
      } else {
        this.packageName = packageName;
        this.version = version;
        this.initialize();
      }
    });

    process.on('SIGINT', () => {
      console.log(this.errors.userCancelled);
      this.saveConfig(this.version, true); 
      process.exit(1); 
    });
  }

  async initialize() {
    const { version: latestVersion, url, news } = await this.getLatestReleaseFromAPI();

    let config;
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } else {
      config = { initialized: false, interrupted: false };
    }

    if (config.interrupted) {
      console.log(this.errors.resumeDownload);
      const userWantsToResume = await this.askForResume();
      if (userWantsToResume) {
        await this.downloadRepo(url); 
        this.saveConfig(latestVersion, false); 
        return;
      }
    }

    if (!config.initialized) {
      const downloadFirstTime = await this.askForFirstDownload();
      if (downloadFirstTime) {
        await this.downloadRepo(url, config.initialized);
        this.saveConfig(latestVersion, false);
        console.log(this.replacePlaceholders(this.messages.downloadSuccess));
      } else {
        console.log(this.errors.firstTimeCancel);
      }
    } else {
      if (this.version === latestVersion) {
        console.log(this.replacePlaceholders(this.messages.updated, { version: latestVersion }));
      } else {
        console.log(this.replacePlaceholders(this.messages.newVersionAvailable, { version: latestVersion }));
        this.parseChangelog(news);

        const userWantsUpdate = await this.askForUpdate();
        if (userWantsUpdate) {
          await this.downloadRepo(url);
          this.saveConfig(latestVersion, false);
          console.log(this.replacePlaceholders(this.messages.updateSuccess, { version: latestVersion }));
        } else {
          console.log(this.errors.updateCancel);
        }
      }
    }
  }

  async getLatestReleaseFromAPI() {
    const apiURL = `https://api.omenlist.xyz/version/check?package=${this.packageName}`;
    try {
      const response = await axios.get(apiURL);
      const { version, url, news } = response.data;
      return { version, url, news };
    } catch (error) {
      console.error(this.errors.apiError, error);
      process.exit(1);
    }
  }

  async askForFirstDownload() {
    const question = [
      {
        type: 'confirm',
        name: 'download',
        message: `${this.replacePlaceholders(this.messages.welcome)}\n${this.messages.noFiles}\n${this.messages.downloadPrompt}`,
        default: true,
      },
    ];

    const answer = await inquirer.prompt(question);
    return answer.download;
  }

  async askForResume() {
    const question = [
      {
        type: 'confirm',
        name: 'resume',
        message: this.errors.resumePrompt,
        default: true,
      },
    ];

    const answer = await inquirer.prompt(question);
    return answer.resume;
  }

  async askForUpdate() {
    const question = [
      {
        type: 'confirm',
        name: 'update',
        message: this.messages.updatePrompt,
        default: false,
      },
    ];

    const answer = await inquirer.prompt(question);
    return answer.update;
  }

  async downloadRepo(repoUrl, initialized) {
    const git = simpleGit();
    const projectRoot = path.resolve(process.cwd());
    const backupDir = path.join(projectRoot, 'backup');
    const tempDir = path.join(projectRoot, 'temp-download');
    
    try {
      if (initialized) {
        console.log(this.messages.creatingBackup);
        await this.createBackup(projectRoot, backupDir);
      }
      console.log(this.replacePlaceholders(this.messages.downloading, { url: repoUrl }));
      await git.clone(repoUrl, tempDir);
      await fsExtra.copy(tempDir, projectRoot);
      await fsExtra.remove(tempDir); 
      console.log(this.messages.downloadSuccess);
    } catch (error) {
      console.error(this.errors.downloadError, error);
      this.saveConfig(this.version, true);
      process.exit(1);
    }
  }

  async createBackup(sourceDir, backupDir) {
    try {
      if (!fsExtra.existsSync(backupDir)) {
        await fsExtra.mkdir(backupDir);
      }
      await fsExtra.emptyDir(backupDir);
      await fsExtra.copy(sourceDir, backupDir);

      console.log(this.messages.backupSuccess);
    } catch (error) {
      console.error(this.errors.backupError, error);
      process.exit(1);
    }
  }

  saveConfig(version, interrupted = false) {
    const config = { packageName: this.packageName, version, initialized: true, interrupted };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }

  replacePlaceholders(message, variables = {}) {
    let result = message;
    result = result.replace('{{packageName}}', this.packageName);
    result = result.replace('{{version}}', variables.version || this.version);
    result = result.replace('{{url}}', variables.url || '');
    return result;
  }

  parseChangelog(news) {
    const changes = news.split(/(?=[+·|-])/).map(change => change.trim()); // Usar regex para dividir por +, ·, y -
  
    // Listas separadas para cada tipo de cambio
    const addedChanges = [];
    const removedChanges = [];
    const fixedChanges = [];
    const notes = [];
  
    // Clasificar los cambios según el símbolo al inicio
    changes.forEach(change => {
      if (change.startsWith('+')) {
        addedChanges.push({ Tipo: this.messages.actionAdded, Descripción: change.slice(1).trim() });
      } else if (change.startsWith('-')) {
        removedChanges.push({ Tipo: this.messages.actionRemoved, Descripción: change.slice(1).trim() });
      } else if (change.startsWith('·')) {
        fixedChanges.push({ Tipo: this.messages.actionFixed, Descripción: change.slice(1).trim() });
      } else if (change.startsWith('|')) {
        notes.push({ Tipo: this.messages.notes, Descripción: change.slice(1).trim() });
      }
    });
  
    // Combinar las listas en el orden deseado: Añadido -> Eliminado -> Arreglado -> Notas
    const orderedChanges = [...addedChanges, ...removedChanges, ...fixedChanges, ...notes];
  
    // Mostrar todos los cambios en una sola tabla
    console.table(orderedChanges);
  }
}

module.exports = Startup;