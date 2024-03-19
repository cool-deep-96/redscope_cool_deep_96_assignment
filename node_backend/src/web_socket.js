import { WebSocketServer } from 'ws';
import fs from 'fs-extra';
import { dataFolderName } from './constants.js'
import path from "path";
import  {v4 as uuidv4}  from 'uuid';


//stores info about connected clients 
const clients = new Map();

const startWebSocketServer = () => {

  const wss = new WebSocketServer({ port: 3008 });

  wss.on('connection', (ws) => {
    const sessionId = uuidv4();
    clients.set(ws, sessionId);
    console.log('WebSocket connection established.');
      
    //send sessionId of new connected clients;
    ws.send(JSON.stringify({sessionId}));

    // Handle incoming messages
    ws.on('message', (message) => {
      const payload = JSON.parse(message.toString());
      processPayload(payload);
    });

    ws.on('close', ()=>{
      clients.set(ws, sessionId);
      console.log('WebSocket connection disconnected')
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
    sessions.push({sessionId: sessionId, urls: [url]});
    let newDirectory = path.join(dataFolderName, sessionId);

    //creating new directory for new session
    fs.mkdirSync(newDirectory, { recursive: true }, (err)=>{
      if(err){
        console.log('Error in creating new directory => ', err);
      }else{

        // writing new file
        dataFilePath = path.join(newDirectory, "1");
        fs.writeJSONSync(dataFilePath, jsonData);
      }
    })
  }

};


export {
  startWebSocketServer,
};
