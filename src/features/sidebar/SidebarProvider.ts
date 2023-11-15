// import { TreeDataProvider, TreeItem, WebviewViewProvider } from 'vscode';


// class SidebarProvider implements TreeDataProvider<string> {

//     private data: string[] = ['Item 1', 'Item 2'];

//     getChildren(element?: string): string[] | Thenable<string[]> {
//         return this.data;
//     }

//     getTreeItem(element: string): TreeItem | Thenable<TreeItem> {
//         return {
//             label: element,
//         };
//     }
// }


// export default SidebarProvider;
import fs from "fs";

import * as vscode from 'vscode';

class SidebarProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'bpilot.sidebarView';

	private _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
	) { }

	public async resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;
		
		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = await this._getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(data => {
			switch (data.type) {
				case 'clear':
					{
						console.log("recieved");
						
						break;
					}
			}
		});
	}

	public addChat() {
		
		if (this._view) {
			// this._view.show?.(true); // `show` is not implemented in 1.49 but is for 1.50 insiders
			this._view.webview.postMessage({ type: 'addMessage', data: { isAi: false, message: "dasfasdf fdg sd" } });
		}
	}

	private async _getHtmlForWebview(webview: vscode.Webview) {
		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'assets', 'main.js'));

		// Do the same for the stylesheet.
		// const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'assets', 'reset.css'));
		const aiRobo = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'assets', 'ai-robo.png'));
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'assets', 'main.css'));

		// Use a nonce to only allow a specific script to be run.
		// const nonce = getNonce();
		
		// Use a nonce to only allow a specific script to be run.
		let html: string = `
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Dark Theme Chat UI</title>
			<link href="${styleMainUri}" rel="stylesheet">

		</head>
		<body>
			<img src="${aiRobo}" alt="">
			<div class="chat-container" id="chatContainer">
				<div class="message user-message">Hello, How can i help??.</div>
				<div class="message other-message">Hi, this is a response from someone else.</div>
			</div>
			<div class="input-container">
				<input type="text" id="messageInput" placeholder="Type your message...">
				<button>Send</button>
			</div>
			<script src="${scriptUri}"></script>
		</body>
		</html>

		` ;
		
		return html;
	}
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

export default SidebarProvider;