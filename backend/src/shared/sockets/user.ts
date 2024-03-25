import { ILogin, ISocketData } from '@src/features/user/interfaces/user.interface';
import { Server, Socket } from 'socket.io';

export let SocketIOUserObject: Server;

// this will be used inside the chat handler
export const connectedUsersMap: Map<string, string> = new Map();

// will hold names of all logged in users
let users: string[] = [];

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
      socket.on('setup', (data: ILogin) =>{
        // userId here wil be the user's username
        this.addClientToMap(data.userId, socket.id);
        this.addUser(data.userId);
      });

      socket.on('block user', (data: ISocketData) => {
        this.io.emit('blocked user id', data);
      });
      socket.on('un block user', (data: ISocketData) => {
        this.io.emit('unblock user id', data);
      });

      socket.on('disconnect', ()=>{
        this.removeClientFromMap(socket.id);
      });

    });
  }

  // will add logged in client to the connectedusersmap
  public addClientToMap(userId: string, socketId: string): void{
    // first check if the userId exists in the map
    if(!connectedUsersMap.has(userId)) {
      // set it if it doesn't exists
      connectedUsersMap.set(userId, socketId);
    }
  }

  // remove clients from the connectedUsersMap
  private removeClientFromMap(socketId: string): void{
    if(Array.from(connectedUsersMap.values()).includes(socketId)){
      const disconnectedUser: [string, string] = [...connectedUsersMap].find((user: [string, string]) =>{
        return user[1] === socketId;
      }) as [string, string];
      connectedUsersMap.delete(disconnectedUser[0]);
      this.removeUser(disconnectedUser[0]);
      this.io.emit('user online', users);
    }
  }

  private addUser(username: string): void {
    users.push(username);
    // removing duplicate usernames
    users = [...new Set(users)];
  }

  private removeUser(username: string): void {
    users = users.filter((name: string) => name!== username);
  }
}

