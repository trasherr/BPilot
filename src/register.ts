import { DiscussServiceClient } from '@google-ai/generativelanguage';
import * as vscode from 'vscode';
const { TextServiceClient } = require("@google-ai/generativelanguage").v1beta2;
const { GoogleAuth } = require("google-auth-library");
// import { TextServiceClient } from "@google-ai/generativelanguage";
// import { GoogleAuth } from "google-auth-library";

export const setApiKey = (context: vscode.ExtensionContext) => {
    let disposable = vscode.commands.registerCommand('bpilot.setBpilotApiKey', async () => {
		let apiKey = await vscode.window.showInputBox({
            prompt: 'Enter your API key'
        });

        if (apiKey) {
            // Store the API key in workspace configuration
            await vscode.workspace.getConfiguration().update('bpilot.bardApiKey', apiKey, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage('API key saved successfully.');
            vscode.window.showInformationMessage(apiKey);
        } else {
            vscode.window.showInformationMessage('No API key provided.');
        }
	});

    context.subscriptions.push(disposable);
};

export const bpilotChat = (context: vscode.ExtensionContext) => {


    let disposable = vscode.commands.registerCommand('bpilot.bpilotChat', async (context) => {
        
        if(context["text"] === undefined){
            return ;
        }
        let key: string | undefined = await vscode.workspace.getConfiguration().get('bpilot.bardApiKey') ;

        
        if(!key || key === "") {
            vscode.window.showInformationMessage('API Key Not Found');
            return ;
        }
      
        vscode.window.showInformationMessage('Processing ...');
                 
        const MODEL_NAME = "models/chat-bison-001";
        const client = new DiscussServiceClient({
            authClient: new GoogleAuth().fromAPIKey(key),
        });

        
        client
        .generateMessage({
            model: MODEL_NAME,
            candidateCount: 1,
            prompt: {
                messages: [{ content: context["text"]}],
            },
        })
        .then((result: any) => {
            console.log(result[0].candidates[0]);
            vscode.commands.executeCommand('bpilot.addChat',{ arg1: true,arg2:result[0].candidates[0].content});
        });
      
        
	});

    context.subscriptions.push(disposable);
};

export const bpilotGenerate = (context: vscode.ExtensionContext) => {
    let disposable = vscode.commands.registerCommand('bpilot.BpilotGenerate', async () => {
        let key: string | undefined = await vscode.workspace.getConfiguration().get('bpilot.bardApiKey') ;

        
        if(!key || key === "") {
            vscode.window.showInformationMessage('API Key Not Found');
            return ;
        }
        
        const editor = vscode.window.activeTextEditor;
        
        if (!editor) {
            vscode.window.showInformationMessage('No active editor found.');
            return ;
        } 
        vscode.commands.executeCommand('bpilot.addChat',{ arg1: false,arg2:editor.document.getText(editor.selection)});
        
        vscode.window.showInformationMessage('Generating!');
            
      
        isGeneratingCode(editor);

        if(editor.document.getText.length < 7000){
            smallFile(editor,key);
        }
        else{
            bigFile(editor,key);
        }
        
	});

    context.subscriptions.push(disposable);
};


export const fixError = (context: vscode.ExtensionContext) => {

    let disposable = vscode.commands.registerCommand('bpilot.BpilotErrorFix', async () => {
        let key: string | undefined = await vscode.workspace.getConfiguration().get('bpilot.bardApiKey') ;

        if(!key || key === "") {
            vscode.window.showInformationMessage('API Key Not Found');
            return ;
        }
        
        const editor = vscode.window.activeTextEditor;
        vscode.commands.executeCommand('bpilot.addChat',{ arg1: false,arg2:"Fix code"});
        
        if (!editor) {
            vscode.window.showInformationMessage('No active editor found.');
            return ;
        } 
        
        vscode.window.showInformationMessage('Generating!');
        // isGeneratingCode(editor);
            
        const MODEL_NAME = "models/text-bison-001";
        const client = new TextServiceClient({
            authClient: new GoogleAuth().fromAPIKey(key),
        });

        
        const prompt = getPromptFixError(editor);

        client
        .generateText({
            model: MODEL_NAME,
            prompt: {
            text: prompt,
            },
        })
        .then((result: any) => {
            // console.log(result[0].candidates[0].output);
            let editor = vscode.window.activeTextEditor;
            vscode.commands.executeCommand('bpilot.addChat',{ arg1: true,arg2:result[0].candidates[0].output});

            let ch = result[0].candidates[0].output.search('\n');
            let fixedCode = result[0].candidates[0].output.slice(ch,-3);

            editor?.edit(editBuilder => {
                editBuilder.replace(
                    new vscode.Range(
                        new vscode.Position(editor!.selection!.start.line, 0),
                        new vscode.Position(editor!.selection!.end.line + 1, 0)
                    ),
                    fixedCode
                );

            });
        });
	});

    context.subscriptions.push(disposable);

};


function isGeneratingCode(editor: vscode.TextEditor){
    
    let position = new vscode.Position(editor.selection.end.line + 1, 0); // Position below the selection
    editor.edit(editBuilder => {
        editBuilder.insert(position, '/* Generating... */\n');
    });
}

function getPromptCodeGeneration(editor: vscode.TextEditor){
    const prompt = `
    File name: ${editor.document.fileName}
    ${editor.document.getText(editor.selection)}. 
    
    Use the following template. Include proper comments for explanation.
    
    // Imports: Start //

    // Imports: End //

    // code: Start //

    // code: End //
    `;
    // console.log(prompt);
    return prompt;
}


function getPromptFixError(editor: vscode.TextEditor){
    const prompt = `
    File name: ${editor.document.fileName}
    fix errors in the code given bellow

    ${editor.document.getText(editor.selection)}. 
    `;
    // console.log(prompt);
    return prompt;
}


function bigFile(editor: vscode.TextEditor,key: string){
    const MODEL_NAME = "models/text-bison-001";
    const client = new TextServiceClient({
        authClient: new GoogleAuth().fromAPIKey(key),
    });
    const prompt = getPromptCodeGeneration(editor);

    client
    .generateText({
        model: MODEL_NAME,
        prompt: {
        text:prompt ,
        },
    })
    .then((result: any) => {
        vscode.commands.executeCommand('bpilot.addChat',{ arg1: true,arg2:result[0].candidates[0].output});

        let editor = vscode.window.activeTextEditor;
        
        let st_imports = result[0].candidates[0].output.search("// Imports: Start //");
        let ed_imports = result[0].candidates[0].output.search("// Imports: End //");

        let st_code =  result[0].candidates[0].output.search("// code: Start //");
        let ed_code =  result[0].candidates[0].output.search("// code: End //");

        const importStatements = result[0].candidates[0].output.slice(st_imports+20,ed_imports);
        const codeStatements = result[0].candidates[0].output.slice(st_code+17,ed_code);

        let position = new vscode.Position(editor!.selection!.end.line + 1, 0); // Position below the selection

        editor?.edit(editBuilder => {
            editBuilder.replace(new vscode.Range(position,new vscode.Position(editor!.selection!.end.line + 1, 19)),"");
            editBuilder.insert(new vscode.Position(0,0), importStatements);
            editBuilder.insert(position, codeStatements);
        });
    });
}



function smallFile(editor: vscode.TextEditor,key: string){
    const MODEL_NAME = "models/text-bison-001";
    const client = new TextServiceClient({
        authClient: new GoogleAuth().fromAPIKey(key),
    });
    const prompt =  `
        ${editor.document.getText(editor.selection)}

        ${ editor.document.getText(new vscode.Range(new vscode.Position(0,0), new vscode.Position(editor.selection.end.line+1,0)))}

        Ony write new code 
        Include proper comments for explanation 
        Use the template given below
    
        // Imports: Start //
    
        // Imports: End //
    
        // code: Start //
    
        // code: End //
    `;

    // console.log(prompt);
   
    client
    .generateText({
        model: MODEL_NAME,
        prompt: {
        text:prompt ,
        },
    })
    .then((result: any) => {
        // console.log(result[0].candidates[0].output);
        vscode.commands.executeCommand('bpilot.addChat',{ arg1: true,arg2:result[0].candidates[0].output});
        
        let editor = vscode.window.activeTextEditor;
        
        let st_imports = result[0].candidates[0].output.search("// Imports: Start //");
        let ed_imports = result[0].candidates[0].output.search("// Imports: End //");

        let st_code =  result[0].candidates[0].output.search("// code: Start //");
        let ed_code =  result[0].candidates[0].output.search("// code: End //");

        const importStatements = result[0].candidates[0].output.slice(st_imports+20,ed_imports);
        const codeStatements = result[0].candidates[0].output.slice(st_code+17,ed_code);

        let position = new vscode.Position(editor!.selection!.end.line + 1, 0); // Position below the selection

        editor?.edit(editBuilder => {
            editBuilder.replace(new vscode.Range(position,new vscode.Position(editor!.selection!.end.line + 1, 19)),"");
            editBuilder.insert(new vscode.Position(0,0), importStatements);
            editBuilder.insert(position, codeStatements);
        });
    });
}