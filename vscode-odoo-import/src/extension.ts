import * as vscode from "vscode";

export async function activate(context: vscode.ExtensionContext) {
  const tsExtension = vscode.extensions.getExtension('vscode.typescript-language-features')
  if (!tsExtension) return
  await tsExtension?.activate()

  if (!tsExtension.exports?.getApi) return
  const api = tsExtension.exports.getAPI(0)
  if (!api) return

  api.configurePlugin('odoo-import', {})

  console.log(
    'Congratulations, your extension "vscode-odoo-import" is now active!'
  );
}

// this method is called when your extension is deactivated
export function deactivate() { }
