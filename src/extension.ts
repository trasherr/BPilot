// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as commandsActivator from "./register";
import SidebarProvider from './features/sidebar/SidebarProvider';
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "bpilot" is now active!');
	commandsActivator.setApiKey(context);
	commandsActivator.bpilotGenerate(context);
	commandsActivator.fixError(context);
	commandsActivator.bpilotChat(context);


	const provider = new SidebarProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(SidebarProvider.viewType, provider));

	context.subscriptions.push(
		vscode.commands.registerCommand('bpilot.addChat', (context) => {
		
			if(context["arg1"] === undefined || context["arg2"] === undefined){
				vscode.window.showInformationMessage('Args not found');
				return ;
			}
			
			provider.addChat(context["arg1"],context["arg2"]);
		})
	);

	

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json

	// context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}

