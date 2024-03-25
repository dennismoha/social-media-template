import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import mongoose from 'mongoose';

import { MARK_MESSAGEAS_AS_READ_IN_DB_JOB } from '@src/constants';
import { MessageCache } from '@src/shared/services/redis/message.cache';
import { joiValidation } from '@src/shared/globals/decorators/joi-validation-decorators';
import { markChatSchema } from '@src/features/chat/schemes/chat';
import { IMessageData } from '@src/features/chat/interfaces/chat.interface';
import { socketIOChatObject } from '@src/shared/sockets/chat';
import { chatQueue } from '@src/shared/services/queues/chat.queue';

const messageCache: MessageCache = new MessageCache();

export class Update {
  @joiValidation(markChatSchema)
  public async message(req: Request, res: Response): Promise<void> {
    const { senderId, receiverId } = req.body;
    const updatedMessage: IMessageData = await messageCache.updateChatMessages(`${senderId}`, `${receiverId}`);
    socketIOChatObject.emit('message read', updatedMessage);
    socketIOChatObject.emit('chat list', updatedMessage);
    chatQueue.addChatJob(MARK_MESSAGEAS_AS_READ_IN_DB_JOB, {
      senderId: new mongoose.Types.ObjectId(senderId),
      receiverId: new mongoose.Types.ObjectId(receiverId)
    });
    res.status(HTTP_STATUS.OK).json({ message: 'Message marked as read' });
  }
}
