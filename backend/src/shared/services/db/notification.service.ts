import { INotificationDocument } from '@src/features/notifications/interfaces/notification.interface';
import { NotificationModel } from '@src/features/notifications/models/notification.schema';
import mongoose from 'mongoose';

class NotificationService {
  public async getNotifications(userId: string): Promise<INotificationDocument[]> {
    /*
      This code performs an aggregation query on the NotificationModel collection in MongoDB.
      It fetches notifications for a specific user,populates additional fields by performing lookups on
      related collections (User and Auth), and reshapes the output documents before returning them.
     */
    const notifications: INotificationDocument[] = await NotificationModel.aggregate([
      /*
        $match:
        This stage filters documents where the userTo field matches the provided userId.
      */
      { $match: { userTo: new mongoose.Types.ObjectId(userId) } },
      /*
          $lookup:
          This stage performs a left outer join with the User collection.
          It matches documents where the userFrom field in the current collection (NotificationModel) equals the _id field in the User collection.
          Results are stored in the userFrom field.
      */
      { $lookup: { from: 'User', localField: 'userFrom', foreignField: '_id', as: 'userFrom' } },
      { $unwind: '$userFrom' },

      /*
        The code below performs a left outer join with the Auth collection.
        It matches documents where the userFrom.authId field in the current collection matches the _id field in the Auth collection.
        Results are stored in the authId field.
      */

      { $lookup: { from: 'Auth', localField: 'userFrom.authId', foreignField: '_id', as: 'authId' } },
      // This stage deconstructs the authId array created by the second $lookup stage to an object
      { $unwind: '$authId' },

      /*
        $project:
        This stage reshapes documents.
        It includes or excludes fields from the output documents.
        It renames fields and computes new fields.
        Fields prefixed with 1 are included in the output document.
        Fields prefixed with $ are reshaped using values from other fields.

      */
      {
        $project: {
          _id: 1,
          message: 1,
          comment: 1,
          createdAt: 1,
          createdItemId: 1,
          entityId: 1,
          notificationType: 1,
          gifUrl: 1,
          imgId: 1,
          imgVersion: 1,
          post: 1,
          reaction: 1,
          read: 1,
          userTo: 1,
          userFrom: {
            profilePicture: '$userFrom.profilePicture',
            username: '$authId.username',
            avatarColor: '$authId.avatarColor',
            uId: '$authId.uId'
          }
        }
      }
    ]);
    return notifications;
  }

  public async updateNotification(notificationId: string): Promise<void> {
    // set the notification as read
    await NotificationModel.updateOne({ _id: notificationId }, { $set: { read: true } }).exec();
  }

  public async deleteNotification(notificationId: string): Promise<void> {
    await NotificationModel.deleteOne({ _id: notificationId }).exec();
  }
}

export const notificationService: NotificationService = new NotificationService();
