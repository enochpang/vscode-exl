import * as vscode from "vscode";
import * as providers from "./providers";
import * as commands from "./commands";
import { get_parsedFile, remove_parsedFile } from "./utils";
import { token_legend } from "./providers";

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.languages.registerDocumentSymbolProvider(
			{ language: "dxl" },
			new providers.DxlDocumentSymbolProvider(),
		),
	);

	context.subscriptions.push(
		vscode.languages.registerDocumentSemanticTokensProvider(
			{ language: "dxl" },
			new providers.DxlSemanticTokensProvider(),
			token_legend,
		),
	);

	context.subscriptions.push(
		vscode.languages.registerRenameProvider(
			{ language: "dxl" },
			new providers.DxlRenameProvider(),
		),
	);

	context.subscriptions.push(
		vscode.languages.registerDefinitionProvider(
			{ language: "dxl" },
			new providers.DxlDefinitionProvider(),
		),
	);

	context.subscriptions.push(
		vscode.languages.registerReferenceProvider(
			{ language: "dxl" },
			new providers.DxlReferenceProvider(),
		),
	);

	context.subscriptions.push(
		vscode.workspace.onDidSaveTextDocument((document) => {
			if (document.languageId === "dxl") {
				get_parsedFile(document);
			}
		}),
	);

	context.subscriptions.push(
		vscode.workspace.onDidCloseTextDocument((document) => {
			remove_parsedFile(document.fileName);
		}),
	);

	context.subscriptions.push(
		vscode.commands.registerCommand("vscode-dxl.showCst", () => {
			const activeEditor = vscode.window.activeTextEditor;
			if (activeEditor) {
				commands.show_cst(activeEditor.document.getText());
			}
		}),
	);
}

export function deactivate() {}
