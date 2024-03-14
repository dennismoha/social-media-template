import { IFollower } from '@src/features/follower/interfaces/follower.interface';

import { Server, Socket } from 'socket.io';

export let SocketIOFollowerObject: Server;

export class SocketIOFollowerHandler {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    SocketIOFollowerObject = io;
  }

  public listen(): void {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this.io.on('connection', (socket: Socket) => {
      console.log('follower socket connected');

      socket.on('unfollow user', (data: IFollower) => {
        this.io.emit('remove follower', data);
      });
    });
  }
}
