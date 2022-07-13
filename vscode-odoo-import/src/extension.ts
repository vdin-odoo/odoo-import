import * as vscode from "vscode";
import { join } from "path";

export async function activate(context: vscode.ExtensionContext) {
  const tsExtension = vscode.extensions.getExtension("vscode.typescript-language-features");
  if (!tsExtension) return;
  await tsExtension?.activate();

  if (!tsExtension.exports?.getApi) return;
  const api = tsExtension.exports.getAPI(0);
  if (!api) return;

  function refresh() {
    const root = vscode.workspace.getConfiguration("odooImport");
    const folders = vscode.workspace.workspaceFolders || [];
    const addonDirs: string[] = root.get("addonDirectories") || [];
    api.configurePlugin("odoo-import", {
      addonDirectories: folders.flatMap((folder) => addonDirs.map((dir) => join(folder.uri.fsPath, dir))),
    });
  }

  refresh();

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("odooImport")) refresh();
    })
  );

  console.log('Congratulations, your extension "vscode-odoo-import" is now active!');
}

// this method is called when your extension is deactivated
export function deactivate() {}
