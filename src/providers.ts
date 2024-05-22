import * as vscode from "vscode";
import * as dxl from "./parse/lib";
import { get_parsedFile } from "./utils";
import { OSemanticKind } from "./parse/lib";

export const token_legend = new vscode.SemanticTokensLegend(
	Object.values(OSemanticKind),
	Object.values(dxl.OSemanticModifierKind),
);

export class DxlDocumentSymbolProvider {
	provideDocumentSymbols(
		document: vscode.TextDocument,
		_token: vscode.CancellationToken,
	): vscode.ProviderResult<
		vscode.DocumentSymbol[] | vscode.SymbolInformation[]
	> {
		return new Promise((resolve, _reject) => {
			const res: vscode.DocumentSymbol[] = [];

			const tree = get_parsedFile(document);
			if (tree) {
				const items = dxl.getSymbols(tree).symbols;

				for (const item of items) {
					res.push(
						new vscode.DocumentSymbol(
							item.name,
							"",
							vscode.SymbolKind.Function,
							new vscode.Range(
								new vscode.Position(
									item.range.start.line,
									item.range.start.col,
								),
								new vscode.Position(item.range.end.line, item.range.end.col),
							),
							new vscode.Range(
								new vscode.Position(
									item.selectionRange.start.line,
									item.selectionRange.start.col,
								),
								new vscode.Position(
									item.selectionRange.end.line,
									item.selectionRange.end.col,
								),
							),
						),
					);
				}
			}

			return resolve(res);
		});
	}
}

export class DxlSemanticTokensProvider
	implements vscode.DocumentSemanticTokensProvider
{
	onDidChangeSemanticTokens?: vscode.Event<void>;
	provideDocumentSemanticTokens(
		document: vscode.TextDocument,
		_token: vscode.CancellationToken,
	): vscode.ProviderResult<vscode.SemanticTokens> {
		const tokensBuilder = new vscode.SemanticTokensBuilder(token_legend);

		const tree = get_parsedFile(document);
		if (tree) {
			const items = dxl.getSymbols(tree);

			for (const item of items.tokens) {
				tokensBuilder.push(
					new vscode.Range(
						new vscode.Position(item.range.start.line, item.range.start.col),
						new vscode.Position(item.range.end.line, item.range.end.col),
					),
					item.kind,
					item.modifiers,
				);
			}
		}

		return tokensBuilder.build();
	}
}

export class DxlRenameProvider implements vscode.RenameProvider {
	provideRenameEdits(
		document: vscode.TextDocument,
		position: vscode.Position,
		newName: string,
		_token: vscode.CancellationToken,
	): vscode.ProviderResult<vscode.WorkspaceEdit> {
		const tree = get_parsedFile(document);
		if (tree) {
			const offset = document.offsetAt(position);
			const references = dxl.find.find_references(tree, offset);
			if (references) {
				const workspaceEdit = new vscode.WorkspaceEdit();
				for (const reference of references) {
					const token = reference.green.token;
					const start = token.start_loc;
					const end = token.end_loc;

					workspaceEdit.replace(
						document.uri,
						new vscode.Range(
							new vscode.Position(start.line, start.col),
							new vscode.Position(end.line, end.col),
						),
						newName,
					);
				}

				return workspaceEdit;
			}
		}

		throw new Error("Method not implemented.");
	}
}

export class DxlDefinitionProvider implements vscode.DefinitionProvider {
	provideDefinition(
		document: vscode.TextDocument,
		position: vscode.Position,
		_token: vscode.CancellationToken,
	): vscode.ProviderResult<vscode.Definition | vscode.LocationLink[]> {
		const tree = get_parsedFile(document);
		if (tree) {
			const offset = document.offsetAt(position);
			const result = dxl.find.find_definition(tree, offset);
			if (result) {
				const token = result.green.token;
				const start = token.start_loc;
				const end = token.end_loc;
				const location = new vscode.Location(
					document.uri,
					new vscode.Range(
						new vscode.Position(start.line, start.col),
						new vscode.Position(end.line, end.col),
					),
				);

				return location;
			}
		}

		throw new Error("Method not implemented.");
	}
}

export class DxlReferenceProvider implements vscode.ReferenceProvider {
	provideReferences(
		document: vscode.TextDocument,
		position: vscode.Position,
		_context: vscode.ReferenceContext,
		_token: vscode.CancellationToken,
	): vscode.ProviderResult<vscode.Location[]> {
		const locations: vscode.Location[] = [];

		const tree = get_parsedFile(document);
		if (tree) {
			const offset = document.offsetAt(position);
			const results = dxl.find.find_references(tree, offset);
			if (results) {
				for (const result of results) {
					const token = result.green.token;
					const start = token.start_loc;
					const end = token.end_loc;
					const location = new vscode.Location(
						document.uri,
						new vscode.Range(
							new vscode.Position(start.line, start.col),
							new vscode.Position(end.line, end.col),
						),
					);

					locations.push(location);
				}
			}

			return locations;
		}

		throw new Error("Method not implemented.");
	}
}
