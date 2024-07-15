import express, { Express, Request, Response } from "express";
import { Server } from 'ws';
import morgan from 'morgan';
import dotenv from "dotenv";
import fs from 'fs';
import https from 'https';
import path from 'path';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;
const socketPort = process.env.SOCKET_PORT || 3001;

let userToken = undefined;

let update: (param: any) => any;

app.get("/", (req: Request, res: Response) => {
  console.log(req);
  console.log('work');
  res.send("Express + TypeScript Server");
});

app.get("/redirect", (req: Request, res: Response) => {
  // console.log(req.url.hash);

  res.sendFile(path.join(__dirname, 'redirect.html'));
  // res.send("Success, Please close this window.");
});
app.get("/store", (req: Request, res: Response) => {
  console.log(req.query);
  const { query } = req;
  userToken = query.access_token;

  console.log('update', update);
  if (typeof update !== 'undefined') {
    update(userToken);
  }
  
  // res.sendFile(path.join(__dirname, 'redirect.html'));
  // res.send("Success, Please close this window.");
});

// Middleware
app.use(morgan("dev"));

// Read SSL certificate and key files
const options = {
  key: fs.readFileSync(path.join(__dirname, "../ssl/localhost-key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "../ssl/localhost.pem")),
};

// Create HTTPS server
const server = https.createServer(options, app);


// Websocket
const socketServer = express().listen(socketPort, () => {
  console.log(`Listening on ${socketPort}`)
})


const arr: any[] = [];
const wss = new Server({ server: socketServer })
//當有 client 連線成功時
wss.on('connection', ws => {
  console.log('Client connected')
  // 當收到client消息時
  
  update = (content: any) => { ws.send(content) }
  
  ws.on('message', data => {
    // 收回來是 Buffer 格式、需轉成字串
    const res = data.toString()  
    arr.push(res);
    
    /// 發送消息給client 
    ws.send(arr)


    /// 發送給所有client： 
    // let clients = wss.clients  //取得所有連接中的 client
    // clients.forEach(client => {
    //     client.send(data)  // 發送至每個 client
    // })
  })
  // 當連線關閉
  ws.on('close', () => {
    console.log('Close connected')
  })
})

server.listen(port, () => {
  console.log(`App listening on https://localhost:${port}`);
});
