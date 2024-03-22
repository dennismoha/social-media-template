import { ADD_CHAT_MESSAGE_TO_DB_JOB } from '@src/constants';
import { IChatJobData, IMessageData } from '@src/features/chat/interfaces/chat.interface';
import { BaseQueue } from '@src/shared/services/queues/base.queue';
import { chatWorker } from '@src/shared/workers/chat.worker';

class ChatQueue extends BaseQueue {
  constructor() {
    super('chats');
    this.processJob(ADD_CHAT_MESSAGE_TO_DB_JOB, 5, chatWorker.addChatMessageToDB);
    // this.processJob('markMessageAsDeletedInDB', 5, chatWorker.markMessageAsDeleted);
    // this.processJob('markMessagesAsReadInDB', 5, chatWorker.markMessagesAsReadInDB);
    // this.processJob('updateMessageReaction', 5, chatWorker.updateMessageReaction);
  }

  public addChatJob(name: string, data: IChatJobData | IMessageData): void {
    this.addJob(name, data);
  }
}

export const chatQueue: ChatQueue = new ChatQueue();
