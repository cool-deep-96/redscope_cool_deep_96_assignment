let webSocket = null;
let sessionId = null;

chrome.tabs.onActivated.addListener((tab) => {
  chrome.tabs.query({ active: true, currentWindow: true },
    (tabs) => {
      if (sessionId) {
        console.log(tabs);
        chrome.tabs.sendMessage(tabs[0].id, { rrweb: true });
      }
    })
})

//estabish websocket connection 
function connectToWebSocket() {

  webSocket = new WebSocket('ws://localhost:3008');

  webSocket.onopen = () => {
    console.log('WebSocket connected');
    changeIcon("../icons/server_up.png");
    if (sessionId) {
      chrome.tabs.query({ active: true, currentWindow: true },
        (tabs) => {
          if (webSocket) {
            chrome.tabs.sendMessage(tabs[0].id, { rrweb: true });
          }
        })
    }
  };

  webSocket.onerror = (err) => {
    console.error('WebSocket error:', err);
    changeIcon("../icons/server_down.png");
    sessionId = null;
    chrome.storage.local.remove('sessionId');
  };

  webSocket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    sessionId = message.sessionId;


    if (sessionId) {
      chrome.tabs.query({ active: true, currentWindow: true },
        (tabs) => {
          if (webSocket) {
            chrome.tabs.sendMessage(tabs[0].id, { rrweb: true });
          }
        })
      chrome.storage.local.set({ sessionId });
    }
    else{
      chrome.storage.local.remove('sessionId');
    }
  }
}

// Initial connection attempt
connectToWebSocket();

setInterval(() => {
  if (webSocket === null || webSocket.readyState !== WebSocket.OPEN) {
    connectToWebSocket();
  }
}, 5000);


// Message listener from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (webSocket && webSocket.readyState === WebSocket.OPEN && sessionId) {
    console.log({ payload: message.toString() });
    webSocket.send(JSON.stringify({ ...message, sessionId }));

  } else {
    console.log('WebSocket not ready, data ignored');
  }

});


function changeIcon(imageIcon) {
  chrome.action.setIcon({ path: imageIcon });
}

