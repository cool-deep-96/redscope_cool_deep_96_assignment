import { WebSocketServer } from 'ws';
import fs from 'fs-extra';
import { dataFolderName } from './constants.js'
import path from "path";


//stores info about connected clients 

var client = [];
var sessionId = null;

const startWebSocketServer = () => {

  const wss = new WebSocketServer({ port: 3008 });

  wss.on('connection', (ws) => {
    
    client.push(ws);
    console.log('WebSocket connection established.');
      
    //send sessionId to all connected clients;
    client.forEach((ws)=>{
      ws.send(JSON.stringify({sessionId}));
    });
    

    // Handle incoming messages
    ws.on('message', (message) => {

      const payload = JSON.parse(message.toString());
      console.log(payload);

      //message from index.html to change session
      if(payload.type === 'session Id Change'){
        sessionId = payload.data;
        client.forEach((ws)=>{
          ws.send(JSON.stringify({sessionId}));
        });
      }

      //message from chrome extension rrweb
      else if(payload.type === 'rrweb events'){
        processPayload(payload);
      }

      //messase from index.html to stop session
      else if(!payload.session){
        sessionId = null;
        console.log(sessionId);
        client.forEach((ws)=>{
          ws.send(JSON.stringify({sessionId}));
        });
      }

    });

    ws.on('close', ()=>{
      console.log('WebSocket connection disconnected');
    })
  });
};

//sessions [{sessionId: string, url:string[]}]
let sessions =[{}];

const processPayload = (payload) => {
  const { type, url, data, sessionId} = payload;
  console.log("*".repeat(80));
  console.log( {type, url, data, sessionId} );
  console.log("*".repeat(80));

  if (type !== 'rrweb events') {
    return;
  }
  const jsonData = JSON.parse(data);
  let dataFilePath;

  //checking if sessionId is already existing
  const check = sessions.find((session)=> session.sessionId === sessionId);

  //sessionId exists
  if(check){

    //check if url is already existing in urls
    let currentIndex = check.urls.findIndex((thisurl)=>{return thisurl === url});

    //if url exists
    if (currentIndex != -1 ) {
      dataFilePath = path.join(dataFolderName, sessionId, (++currentIndex).toString());
      fs.writeJsonSync(dataFilePath, jsonData, { flag: 'a' });   // appending into already existing file
    } 
    
    //if url doesn't exists
    else {
      check.urls.push(url);
      dataFilePath = path.join(dataFolderName, sessionId, (currentIndex+2).toString());
      fs.writeJsonSync(dataFilePath, jsonData);   //creating new file and writing data

    }
  } 
  

  // sessionId doesn't exist
  else {
    if(sessionId){
      sessions.push({sessionId: sessionId, urls: [url]});
      let newDirectory = path.join(dataFolderName, sessionId);
  
      //creating new directory for new session
      fs.mkdirSync(newDirectory, { recursive: true });
      dataFilePath = path.join(newDirectory, "1");
      console.log(newDirectory, jsonData)
      fs.writeJsonSync(dataFilePath, jsonData); 

    }

  }

};


export {
  startWebSocketServer,
};
