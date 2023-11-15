
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

      // Handle messages sent from the extension to the webview
      window.addEventListener('message', event => {
        const message = event.data; // The json data that the extension sent
        switch (message.type) {
            case 'addMessage':
                {
                    addChat(message.data);
                    break;
                }

        }
    });

    function addChat(data){
        const chatContainer = document.getElementById('chatContainer');

        chat.push({isAi: true, message: "fasdfasd fsdafg safdg",id: autoId++});

        const message = document.createElement('div');
        if(data.isAi){
            message.className = 'message user-message';
        }
        else{
            message.className = 'message other-message';
        }
        message.textContent = data.message;
        chatContainer?.appendChild(message);
        vscode.setState(chat);
    }

    function resumeMessages() {

        const chatContainer = document.getElementById('chatContainer');
        if(chatContainer){

            chatContainer.innerHTML =  "";
        }

        /** @type {any} */
        
        chat.forEach(item => {
            addChat(item);
        });
        vscode.setState(chat);

    }

    resumeMessages();

    // function clearMessages(){
    //     vscode.postMessage({ type: 'clear' });
    //     chat = [];
    //     vscode.setState(chat);

    // }
}());

