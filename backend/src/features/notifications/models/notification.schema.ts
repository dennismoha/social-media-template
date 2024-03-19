import { config } from '@src/config';
import { INotification, INotificationDocument } from '@src/features/notifications/interfaces/notification.interface';
import { notificationService } from '@src/shared/services/db/notification.service';
import Logger from 'bunyan';
import mongoose, { model, Model, Schema } from 'mongoose';

const log: Logger = config.createLogger('commentsCache');

const notificationSchema: Schema = new Schema({
  userTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  userFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  read: { type: Boolean, default: false },
  message: { type: String, default: '' },
  notificationType: String,
  entityId: mongoose.Types.ObjectId,
  createdItemId: mongoose.Types.ObjectId,
  comment: { type: String, default: '' },
  reaction: { type: String, default: '' },
  post: { type: String, default: '' },
  imgId: { type: String, default: '' },
  imgVersion: { type: String, default: '' },
  gifUrl: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now() }
});

// define a method called insertNotification that which will be used to create a new notification

notificationSchema.methods.insertNotification = async function (body: INotification) {
  const {
    userTo,
    userFrom,
    message,
    notificationType,
    entityId,
    createdItemId,
    createdAt,
    comment,
    reaction,
    post,
    imgId,
    imgVersion,
    gifUrl
  } = body;

  // we create the notification
  await NotificationModel.create({
    userTo,
    userFrom,
    message,
    notificationType,
    entityId,
    createdItemId,
    createdAt,
    comment,
    reaction,
    post,
    imgId,
    imgVersion,
    gifUrl
  });

  // for every notification created matching the userTo, we fetch it

  try {
    const notifications: INotificationDocument[] = await notificationService.getNotifications(userTo);
    return notifications;
  } catch (error) {
    log.error('notification module error :', error);
    return error;
  }
};

const NotificationModel: Model<INotificationDocument> = model<INotificationDocument>('Notification', notificationSchema, 'Notification');
export { NotificationModel };
