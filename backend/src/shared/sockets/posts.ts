
import { ICommentDocument } from '@src/features/comments/interfaces/comment.interface';
import { IReactionDocument } from '@src/features/reactions/interfaces/reaction.interface';
import { Server, Socket } from 'socket.io';

export let SocketIOPostObject: Server;

export class SocketIOPostHandler {
  private io: Server;

  constructor(io: Server){
    this.io = io;
    SocketIOPostObject = io;
  }

  public listen(): void {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this.io.on('connection', (socket:Socket)=>{
      console.log('post socket connected');

      socket.on('reaction', (reaction: IReactionDocument) => {
        this.io.emit('update like', reaction);
      });

      socket.on('comment', (data: ICommentDocument) => {
        this.io.emit('update commment', data);
      });
    });
  }
}

