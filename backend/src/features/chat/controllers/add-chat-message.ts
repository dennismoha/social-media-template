import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';
import { UploadApiResponse } from 'cloudinary';
import { addChatSchema } from '@src/features/chat/schemes/chat';
import { joiValidation } from '@src/shared/globals/decorators/joi-validation-decorators';
import { UserCache } from '@src/shared/services/redis/user.cache';
import { IMessageData, IMessageNotification } from '@src/features/chat/interfaces/chat.interface';
import { uploads } from '@src/shared/globals/helpers/cloudinary-upload';
import { IUserDocument } from '@src/features/user/interfaces/user.interface';
import { BadRequestError } from '@src/shared/globals/helpers/error-handler';
import { socketIOChatObject } from '@src/shared/sockets/chat';
import { INotificationTemplate } from '@src/features/notifications/interfaces/notification.interface';
import { notificationTemplate } from '@src/shared/services/emails/templates/notifications/notification-template';
import { emailQueue } from '@src/shared/services/queues/email.queue';
import { ADD_CHAT_MESSAGE_TO_DB_JOB, DIRECT_MESSAGE_EMAIL } from '@src/constants';
import { MessageCache } from '@src/shared/services/redis/message.cache';
import { chatQueue } from '@src/shared/services/queues/chat.queue';

const userCache: UserCache = new UserCache();
const messageCache: MessageCache = new MessageCache();

export class Add {
  // adding a new message
  @joiValidation(addChatSchema)
  public async message(req: Request, res: Response): Promise<void> {
    const {
      conversationId,
      receiverId,
      receiverUsername,
      receiverAvatarColor,
      receiverProfilePicture,
      body,
      gifUrl,
      isRead,
      selectedImage
    } = req.body;
    let fileUrl = '';

    const messageObjectId: ObjectId = new ObjectId();

    /*
        the first time  conversation happens between the sender and the receiver,
        the conversation id is null so we have to create a conversation id as below
    */
    const conversationObjectId: ObjectId = !conversationId ? new ObjectId() : new mongoose.Types.ObjectId(conversationId);

    // fetch the senders data from cache
    const sender: IUserDocument = (await userCache.getUserFromCache(`${req.currentUser!.userId}`)) as IUserDocument;

    // if selectedImage is not an empty string then  it contains an image. upload it
    if (selectedImage.length) {
      const result: UploadApiResponse = (await uploads(req.body.image, req.currentUser!.userId, true, true)) as UploadApiResponse;
      if (!result?.public_id) {
        throw new BadRequestError(result.message);
      }
      fileUrl = `https://res.cloudinary.com/dyamr9ym3/image/upload/v${result.version}/${result.public_id}`;
    }

    // then we construct the message data body that will be saved to the redis and db
    const messageData: IMessageData = {
      _id: `${messageObjectId}`,
      conversationId: new mongoose.Types.ObjectId(conversationObjectId),
      receiverId,
      receiverAvatarColor,
      receiverProfilePicture,
      receiverUsername,
      senderUsername: `${req.currentUser!.username}`,
      senderId: `${req.currentUser!.userId}`,
      senderAvatarColor: `${req.currentUser!.avatarColor}`,
      senderProfilePicture: `${sender.profilePicture}`,
      body,
      isRead,
      gifUrl,
      selectedImage: fileUrl,
      reaction: [],
      createdAt: new Date(),
      deleteForEveryone: false,
      deleteForMe: false
    };

    // update the senders

    Add.prototype.emitSocketIoEvent(messageData);

    /*
        SEND NOTIFICATION
        we will send the notification based on the value of isRead. if isRead is true it means that the
        sender and the receiver are on the same message page else it's false and thus we send a notification

    */

    if (!isRead) {
      Add.prototype.messageNotification({
        currentUser: req.currentUser!,
        message: body,
        receiverName: receiverUsername,
        receiverId,
        messageData
      });
    }

    // add sender to chat list  in cache
    await messageCache.addChatListToCache(`${req.currentUser!.userId}`, `${receiverId}`,`${conversationObjectId}`);

    // add reciver to chat list in cache
    await messageCache.addChatListToCache( `${receiverId}`,`${req.currentUser!.userId}`,`${conversationObjectId}`);

    // add message data to cache
    await messageCache.addChatMessageToCache(`${conversationObjectId}`, messageData);

    // add message to chat queue
    chatQueue.addChatJob(ADD_CHAT_MESSAGE_TO_DB_JOB,messageData);

    res.status(HTTP_STATUS.OK).json({ message: 'message added', conversationId: conversationObjectId });
  }

  public async addChatUsers(req: Request, res: Response): Promise<void> {
    const chatUsers = await messageCache.addChatUsersToCache(req.body);
    socketIOChatObject.emit('add chat users', chatUsers);
    res.status(HTTP_STATUS.OK).json({ message: 'Users added'});
  }

  public async removeChatUsers(req: Request, res: Response): Promise<void> {
    const chatUsers = await messageCache.removeChatUsersFromCache(req.body);
    socketIOChatObject.emit('add chat users', chatUsers);
    res.status(HTTP_STATUS.OK).json({ message: 'Users removed'});
  }

  private emitSocketIoEvent(data: IMessageData): void {
    socketIOChatObject.emit('message received', data); // this updates the chat message page
    socketIOChatObject.emit('chat list', data); // this updates the chat list
  }

  // send notification
  private async messageNotification({ currentUser, message, receiverName, receiverId }: IMessageNotification): Promise<void> {
    const cachedUser: IUserDocument = (await userCache.getUserFromCache(`${receiverId}`)) as IUserDocument;

    if (cachedUser.notifications.messages) {
      // check if user has enabled to receive message notifications
      const templateParams: INotificationTemplate = {
        username: receiverName,
        message,
        header: `Message notification from ${currentUser.username}`
      };
      const template: string = notificationTemplate.notificationMessageTemplate(templateParams);
      emailQueue.AddEmailJob(DIRECT_MESSAGE_EMAIL, {
        receiverEmail: cachedUser.email!,
        template,
        subject: `You've received messages from ${currentUser.username}`
      });
    }
  }
}
