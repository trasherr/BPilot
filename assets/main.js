
// @ts-check
// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.


(function () {

    // @ts-ignore
    const vscode = acquireVsCodeApi();
    const oldState = /** @type {Array<{ isAi: boolean, message: string, id: number }>} */ (vscode.getState());

     /** @type {Array<{ isAi: boolean, message: string, id: number }>} */
    let chat = oldState || [ ];
    let autoId = 0;
    autoId = oldState.reduce((max,item) => autoId > item.id ? max = autoId : max = item.id, 0 );
    autoId += 1;
      // Handle messages sent from the extension to the webview
      window.addEventListener('message', event => {
        const message = event.data; // The json data that the extension sent
        switch (message.type) {
            case 'addMessage':
                {
                    chat.push({isAi: message.data.isAi, message: message.data.message,id: autoId++});
                    vscode.setState(chat);
                    addChatCode({isAi: message.data.isAi, message: message.data.message,id: autoId-1});
                    break;
                }

        }
    });

 

    function addChatCode(data){
        const chatContainer = document.getElementById('chatContainer');

        const message = document.createElement('div');
        if(data.isAi){
            message.className = 'message user-message';
            const codeBlock = document.createElement('code');
            codeBlock.textContent = data.message;
            message.appendChild(codeBlock);
        }
        else{
            message.className = 'message other-message';
            message.textContent = data.message;
        }
        chatContainer?.insertBefore(message, chatContainer.firstChild);
    }

    function resumeMessages() {

        const chatContainer = document.getElementById('chatContainer');
        if(chatContainer){

            chatContainer.innerHTML =  "";
        }

        /** @type {any} */

        chat = chat.slice(0).slice(-50);
        
        chat.forEach(item => {
            addChatCode(item);
        });

    }

    function clearMessages(){
        chat.splice(0,10000);
        vscode.setState(chat);
        resumeMessages();
    }

    function chatBard(){

        // @ts-ignore
        const text = document.getElementById('messageInput')?.value;
        if(text.length < 3){
            return ;
        }

        vscode.postMessage({ type: 'chat',message:text });
        chat.push({isAi: false, message:text,id: autoId++ });
        addChatCode({isAi: false, message:text,id: autoId-1 });


    }
    resumeMessages();


    const clearButton = document.getElementById('clearMessagesButton');
    const chatButton = document.getElementById('chatMessageButton');
    clearButton?.addEventListener("click", clearMessages);
    chatButton?.addEventListener("click", chatBard);

}());

