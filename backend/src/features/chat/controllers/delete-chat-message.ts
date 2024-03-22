import { MARK_MESSAGEAS_DELETED_IN_DB_TO_DB_JOB } from '@src/constants';
import { IMessageData } from '@src/features/chat/interfaces/chat.interface';
import { chatQueue } from '@src/shared/services/queues/chat.queue';
import { MessageCache } from '@src/shared/services/redis/message.cache';
import { socketIOChatObject } from '@src/shared/sockets/chat';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import mongoose from 'mongoose';

const messageCache: MessageCache = new MessageCache();

export class Delete {
  public async markMessageAsDeleted(req: Request, res: Response): Promise<void> {
    const { senderId, receiverId, messageId, type } = req.params;
    // update the cache
    const updatedMessage: IMessageData = await messageCache.markMessageAsDeleted(`${senderId}`, `${receiverId}`, `${messageId}`, type);

    // send data back to the user
    socketIOChatObject.emit('message read', updatedMessage);
    socketIOChatObject.emit('chat list', updatedMessage);
    chatQueue.addChatJob(MARK_MESSAGEAS_DELETED_IN_DB_TO_DB_JOB, {
      messageId: new mongoose.Types.ObjectId(messageId),
      type
    });

    res.status(HTTP_STATUS.OK).json({ message: 'Message marked as deleted' });
  }
}
