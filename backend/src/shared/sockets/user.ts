import { ISocketData } from '@src/features/user/interfaces/user.interface';
import { Server, Socket } from 'socket.io';

export let SocketIOUserObject: Server;

export class SocketIOUserHandler {
  private io: Server;

  constructor(io: Server){
    this.io = io;
    SocketIOUserObject = io;
  }

  public listen(): void {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this.io.on('connection', (socket:Socket)=>{
      console.log('user socket connected');

      socket.on('block user', (data: ISocketData) => {
        this.io.emit('blocked user id', data);
      });
      socket.on('un block user', (data: ISocketData) => {
        this.io.emit('unblock user id', data);
      });


    });
  }
}

