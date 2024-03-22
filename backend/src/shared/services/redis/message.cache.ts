import { config } from '@src/config';
import { IChatList, IChatUsers, IMessageData } from '@src/features/chat/interfaces/chat.interface';
import { ServerError } from '@src/shared/globals/helpers/error-handler';
import { Helpers } from '@src/shared/globals/helpers/helpers';
import { BaseCache } from '@src/shared/services/redis/base.cache';
import Logger from 'bunyan';
import { find, findIndex } from 'lodash';

const log: Logger = config.createLogger('messageCache');

export class MessageCache extends BaseCache {
  constructor() {
    super('messageCache');
  }
  public async addChatListToCache(senderId: string, receiverId: string, conversationId: string): Promise<void> {
    try {
      if(!this.client.isOpen) {
        await this.client.connect();
      }

      /*
        check if the sender has got a chat list.
        for each chat, a chat list with the senders id is created
        in cache
      */
      const userChatList = await this.client.LRANGE(`chatList:${senderId}`, 0, -1);

      // if none we create it for the user
      if(userChatList.length === 0) {
        await this.client.RPUSH(`chatList:${senderId}`, JSON.stringify({ receiverId, conversationId }));
      } else {
        // since it exists, we now find the index of the receiver in the list of the senders list
        const receiverIndex: number = findIndex(userChatList, (listItem: string) => listItem.includes(receiverId));

        // if the receiver id doesn't exists, then these two don't have a conversation.
        // so we create the chat list for both the sender and the receiver
        if (receiverIndex < 0) {
          await this.client.RPUSH(`chatList:${senderId}`, JSON.stringify({ receiverId, conversationId }));
        }
      }
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async addChatMessageToCache(conversationId: string, value: IMessageData): Promise<void> {
    try {
      if(!this.client.isOpen) {
        await this.client.connect();
      }
      await this.client.RPUSH(`messages:${conversationId}`, JSON.stringify(value));
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  // add chat users to cache

  public async addChatUsersToCache(value: IChatUsers): Promise<IChatUsers[]> {
    try {
      if(!this.client.isOpen) {
        await this.client.connect();
      }
      const users: IChatUsers[] = await this.getChatUsersList();
      const usersIndex: number = findIndex(users, (listItem: IChatUsers) => JSON.stringify(listItem) === JSON.stringify(value));
      let chatUsers: IChatUsers[] = [];

      // if no chatpair exists between those two users then add them
      if (usersIndex === -1) {
        await this.client.RPUSH('chatUsers', JSON.stringify(value));
        chatUsers = await this.getChatUsersList();
      } else {
        chatUsers = users;
      }
      return chatUsers;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async removeChatUsersFromCache(value: IChatUsers): Promise<IChatUsers[]> {
    try {
      if(!this.client.isOpen) {
        await this.client.connect();
      }
      const users: IChatUsers[] = await this.getChatUsersList();
      const usersIndex: number = findIndex(users, (listItem: IChatUsers) => JSON.stringify(listItem) === JSON.stringify(value));
      let chatUsers: IChatUsers[] = [];
      if (usersIndex > -1) {
        await this.client.LREM('chatUsers', usersIndex, JSON.stringify(value));
        chatUsers = await this.getChatUsersList();
      } else {
        chatUsers = users;
      }
      return chatUsers;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  // get the list of user conversations
  public async getUserConversationList(key: string):Promise<IMessageData[]> {
    // key is the userId
    try {
      if(!this.client.isOpen) {
        await this.client.connect();
      }

      // we get data for this specific user from the chatlist
      const userChatList: string[] = await this.client.LRANGE(`chatList:${key}`, 0, -1);
      const conversationChatList: IMessageData[] = [];

      for(const item of userChatList) {
        const chatItem: IChatList = Helpers.parseJson(item) as IChatList;
        // using the conversation id of the above, we can fetch the last message the user was sent
        // in the message list
        const lastMessage: string = await this.client.LINDEX(`messages:${chatItem.conversationId}`, -1) as string;
        conversationChatList.push(Helpers.parseJson(lastMessage));
      }
      return conversationChatList;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }

  }

  /*
    GET CHAT MESSAGES OF A CERTAIN USER FROM CACHE
        we can use
          1) The conversationId to fetch the messages
          2) Both the senderId and the receiverID.
        Below we apply the second option
    */
  public async getChatMessagesFromCache(senderId: string, receiverId: string): Promise<IMessageData[]> {
    try {
      if(!this.client.isOpen) {
        await this.client.connect();
      }

      // we use both the receiver id and the sender id to retrieve chats

      /* PROCESS:
           - In the chatlist list, we fetch all userChatlist keys which are equal to the senderID using LRANGE
           - The data returned above contains a receiverId and a conversationID
           - We  use `find` from lodash to filter only userChatlists which include the receiverID
           - We then parse the returned data as json.
           - Then we traverse the messages list returning only data that has got the conversationId in the array as
           - the chatMessages array.
           - Then we push each chatItem in the chatMessages array and return

      */

      const userChatList: string[] = await this.client.LRANGE(`chatList:${senderId}`, 0, -1);
      const receiver: string = find(userChatList, (listItem: string) => listItem.includes(receiverId)) as string;
      const parsedReceiver: IChatList = Helpers.parseJson(receiver) as IChatList;
      if(parsedReceiver) {
        const userMessages: string[] = await this.client.LRANGE(`messages:${parsedReceiver.conversationId}`, 0, -1);
        const chatMessages: IMessageData[] = [];
        for(const item of userMessages) {
          const chatItem = Helpers.parseJson(item) as IMessageData;
          chatMessages.push(chatItem);
        }
        return chatMessages;
      } else {
        return [];
      }

    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }


  private async getChatUsersList(): Promise<IChatUsers[]> {
    const chatUsersList: IChatUsers[] = [];
    const chatUsers = await this.client.LRANGE('chatUsers', 0, -1);
    for(const item of chatUsers) {
      const chatUser: IChatUsers = Helpers.parseJson(item) as IChatUsers;
      chatUsersList.push(chatUser);
    }
    return chatUsersList;
  }

}
