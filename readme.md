# Startup Package

![Omenlist Logo](https://omenlist.xyz/img/logo.png)

A package that helps download and update projects from a repository with multi-language support, resumable downloads, and interactive prompts.

## Features

- Automatically download and update projects from a repository.
- Supports multiple languages.
- Resumable downloads if the process is interrupted.
- Interactive prompts for selecting projects and updating versions.

## Installation

To install the package, use the following command:

```bash
npm install startup-package
```

## Usage

To start using the package, you need to add the following code to your `index.js` file:

```javascript
const Startup = require('startup-package');

// Initialize the package with the project name, version, and language (optional)
new Startup('projectName', '1.0.0', 'en'); // Replace 'projectName' and '1.0.0' with the actual values
```

### Explanation:

- **`projectName`**: Replace this with the name of the project you want to download (e.g., `'template'`).
- **`version`**: Replace this with the version of the project you want to use.
- **`language`**: (Optional) Specify the language for the prompts (default is English, `'en'`).

After adding this to your `index.js`, you can run the project with:

```bash
npm start
```

## Translations

If you want the installation and usage instructions in another language, please visit the corresponding README for your language:

- [Español (Spanish)](locales/es/readme.md)
- [Français (French)](locales/fr/readme.md)
- [Deutsch (German)](locales/de/readme.md)

If your language is not listed here, feel free to contribute by adding a `README.md` in the `locales/` directory for your language.