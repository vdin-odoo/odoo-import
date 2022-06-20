## odoo-import

Adapt the Odoo module system to TypeScript.

- Infers the following Odoo-specific module declaration syntaxes as normal TypeScript references:
  - `odoo.define('foo.bar')`
  - `/** @odoo-module alias=foo.bar */`
  - `import '@foo/bar'`
- Populate autocompletions with appropriate items!

#### Get Started

```
git clone https://github.com/vidi-odoo/odoo-import
npm i && npx tsc

# in your project
npm i typescript path/to/odoo-import
```

Then configure your tsconfig.json to use the plugin, `allowJs` to true and enjoy!

#### Debug

```
TSS_DEBUG_BRK=9559 code example # break until attach
TSS_DEBUG=9559 code example
```
