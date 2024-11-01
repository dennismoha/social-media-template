import { IMessageData } from '@src/features/chat/interfaces/chat.interface';
import { chatService } from '@src/shared/services/db/chat.service';
import { MessageCache } from '@src/shared/services/redis/message.cache';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import mongoose from 'mongoose';


const messageCache: MessageCache = new MessageCache();

export class Get {
  // fetch a user conversationlist
  public async conversationList(req: Request, res: Response): Promise<void> {
    let list: IMessageData[] = [];
    const cachedList: IMessageData[] = await messageCache.getUserConversationList(`${req.currentUser!.userId}`);
    if(cachedList.length) {
      list = cachedList;
    } else {
      list = await chatService.getUserConversationList(new mongoose.Types.ObjectId(req.currentUser!.userId));
    }

    res.status(HTTP_STATUS.OK).json({ message: 'User conversation list', list });
  }

  // fetch messages between two users

  public async messages(req: Request, res: Response): Promise<void> {
    const { receiverId } = req.params;

    let messages: IMessageData[] = [];
    const cachedMessages: IMessageData[] = await messageCache.getChatMessagesFromCache(`${req.currentUser!.userId}`, `${receiverId}`);
    if(cachedMessages.length) {
      messages = cachedMessages;
    } else {
      messages = await chatService.getMessages(
        new mongoose.Types.ObjectId(req.currentUser!.userId),
        new mongoose.Types.ObjectId(receiverId),
        { createdAt: 1 }
      );
    }

    res.status(HTTP_STATUS.OK).json({ message: 'User chat messages', messages });
  }
}
