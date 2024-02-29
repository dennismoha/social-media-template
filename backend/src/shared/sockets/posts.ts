
import { Server, Socket } from 'socket.io';

let SocketIOPostObject: Server

export class SocketIOPostHandler {
  private io: Server;

  constructor(io: Server){
    this.io = io;
    SocketIOPostObject = io;
  }

  public listen(): void {
    this.io.on('connection', (socket:Socket)=>{
      console.log('post socket connected');
    });
  }
}

