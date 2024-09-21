# Paquete Startup

![Logo de Omenlist](https://omenlist.xyz/img/logo.png)

Un paquete que ayuda a descargar y actualizar proyectos desde un repositorio con soporte multilingüe, descargas reanudables y avisos interactivos.

## Características

- Descarga y actualización automática de proyectos desde un repositorio.
- Soporte para múltiples idiomas.
- Descargas reanudables si el proceso se interrumpe.
- Avisos interactivos para seleccionar proyectos y actualizar versiones.

## Instalación

Para instalar el paquete, utiliza el siguiente comando:

```bash
npm install startup-package
```

## Uso

Para comenzar a usar el paquete, necesitas agregar el siguiente código a tu archivo `index.js`:

```javascript
const Startup = require('startup-package');

// Inicializa el paquete con el nombre del proyecto, versión y el idioma (opcional)
new Startup('projectName', '1.0.0', 'es'); // Reemplaza 'projectName' y '1.0.0' con los valores correctos
```

### Explicación:

- **`projectName`**: Reemplaza esto con el nombre del proyecto que deseas descargar (por ejemplo, `'template'`).
- **`version`**: Reemplaza esto con la versión del proyecto que deseas usar.
- **`language`**: (Opcional) Especifica el idioma para los avisos (el valor predeterminado es inglés, `'en'`).

Después de agregar esto a tu `index.js`, puedes ejecutar el proyecto con:

```bash
npm start
```

## Traducciones

Si deseas las instrucciones de instalación y uso en otro idioma, por favor visita el README correspondiente a tu idioma:

- [Español (Spanish)](locales/es/readme.md)
- [Français (Francés)](locales/fr/readme.md)
- [Deutsch (Alemán)](locales/de/readme.md)

Si tu idioma no está listado aquí, siéntete libre de contribuir agregando un `README.md` en el directorio `locales/` para tu idioma.