import { FOLLOWERS_EMAIL } from '@src/constants';
import { IFollowerData, IFollowerDocument } from '@src/features/follower/interfaces/follower.interface';
import { FollowerModel } from '@src/features/follower/models/follower.schema';
import { INotificationDocument, INotificationTemplate } from '@src/features/notifications/interfaces/notification.interface';
import { NotificationModel } from '@src/features/notifications/models/notification.schema';
import { IQueryComplete, IQueryDeleted } from '@src/features/post/interfaces/post.interface';
import { IUserDocument } from '@src/features/user/interfaces/user.interface';
import { UserModel } from '@src/features/user/models/user.schema';
import { notificationTemplate } from '@src/shared/services/emails/templates/notifications/notification-template';
import { emailQueue } from '@src/shared/services/queues/email.queue';
import { UserCache } from '@src/shared/services/redis/user.cache';
import { socketIONotificationObject } from '@src/shared/sockets/notification';
import { map } from 'lodash';
import { ObjectId, BulkWriteResult } from 'mongodb';
import mongoose, { Query } from 'mongoose';

const userCache: UserCache = new UserCache();

class FollowerService {
  public async addFollowerToDB(userId: string, followeeId: string, username: string, followerDocumentId: ObjectId): Promise<void> {
    const followeeObjectId: ObjectId = new mongoose.Types.ObjectId(followeeId);
    const followerObjectId: ObjectId = new mongoose.Types.ObjectId(userId);

    // we create a new document inside the follower collection

 const following =   await FollowerModel.create({
      _id: followerDocumentId,
      followeeId: followeeObjectId,
      followerId: followerObjectId
    });

    // then we update followersCount and followingCount of the user followed and following respectively

    // bulkwrite updates multiple documents using one single mongodb query call so long it's in the same collection
    // bulkwrite doesn't support all mongodb methods

    const users: Promise<BulkWriteResult> = UserModel.bulkWrite([
      {
        updateOne: {
          filter: { _id: userId },
          update: { $inc: { followingCount: 1 }}
        }
      },
      {
        updateOne: {
          filter: { _id: followeeId },
          update: { $inc: { followersCount: 1 }}
        }
      },
    ]);

    const response: [BulkWriteResult, IUserDocument | null] = await Promise.all([users, userCache.getUserFromCache(followeeId)]);
    if (response[1]?.notifications.follows && userId !== followeeId) {
      const notificationModel: INotificationDocument = new NotificationModel();
      const notifications = await notificationModel.insertNotification({
        userFrom: userId,
        userTo: followeeId,
        message: `${username} is now following you.`,
        notificationType: 'follows',
        entityId: new mongoose.Types.ObjectId(userId),
        createdItemId: new mongoose.Types.ObjectId(following._id),
        createdAt: new Date(),
        comment: '',
        post: '',
        imgId: '',
        imgVersion: '',
        gifUrl: '',
        reaction: ''
      });
      socketIONotificationObject.emit('insert notification', notifications, { userTo: followeeId });
      const templateParams: INotificationTemplate = {
        username: response[1].username!,
        message: `${username} is now following you.`,
        header: 'Follower Notification'
      };
      const template: string = notificationTemplate.notificationMessageTemplate(templateParams);
      emailQueue.AddEmailJob(FOLLOWERS_EMAIL, {
        receiverEmail: response[1].email!,
        template,
        subject: `${username} is now following you.`
      });
    }
  }

  // remove follower from db
  public async removeFollowerFromDB(followeeId: string, followerId: string): Promise<void> {
    const followeeObjectId: ObjectId = new mongoose.Types.ObjectId(followeeId);
    const followerObjectId: ObjectId = new mongoose.Types.ObjectId(followerId);

    // we delete one document in the followermodel where followeeid and followerid are equal to what is passed in the params

    const unfollow :Query<IQueryComplete & IQueryDeleted, IFollowerDocument> = FollowerModel.deleteOne({
      followeeId: followeeObjectId,
      followerId: followerObjectId
    });

    // then we update followersCount and followingCount of the user followed and following respectively
    // we subtract one individually

    // bulkwrite updates multiple documents using one single mongodb query call so long it's in the same collection
    // bulkwrite doesn't support all mongodb methods

    const users: Promise<BulkWriteResult> = UserModel.bulkWrite([
      {
        updateOne: {
          filter: { _id: followerId },
          update: { $inc: { followingCount: -1 }}
        }
      },
      {
        updateOne: {
          filter: { _id: followeeId },
          update: { $inc: { followersCount: -1 }}
        }
      },
    ]);


    await Promise.all([unfollow, users]);
  }

  // followeeid is the user that is following and we get that from req.currentUser

  public async getFolloweeData(userObjectId: ObjectId): Promise<IFollowerData[]> {
    const followee: IFollowerData[] = await FollowerModel.aggregate([
      { $match: { followerId: userObjectId } },
      { $lookup: { from: 'User', localField: 'followeeId', foreignField: '_id', as: 'followeeId' } },
      { $unwind: '$followeeId' },
      { $lookup: { from: 'Auth', localField: 'followeeId.authId', foreignField: '_id', as: 'authId' } },
      { $unwind: '$authId' },
      {
        $addFields: {
          _id: '$followeeId._id',
          username: '$authId.username',
          avatarColor: '$authId.avatarColor',
          uId: '$authId.uId',
          postCount: '$followeeId.postsCount',
          followersCount: '$followeeId.followersCount',
          followingCount: '$followeeId.followingCount',
          profilePicture: '$followeeId.profilePicture',
          userProfile: '$followeeId'
        }
      },
      {
        $project: {
          authId: 0,
          followerId: 0,
          followeeId: 0,
          createdAt: 0,
          __v: 0
        }
      }
    ]);
    return followee;
  }

  public async getFollowerData(userObjectId: ObjectId): Promise<IFollowerData[]> {
    const follower: IFollowerData[] = await FollowerModel.aggregate([
      { $match: { followeeId: userObjectId } },
      { $lookup: { from: 'User', localField: 'followerId', foreignField: '_id', as: 'followerId' } },
      { $unwind: '$followerId' },
      { $lookup: { from: 'Auth', localField: 'followerId.authId', foreignField: '_id', as: 'authId' } },
      { $unwind: '$authId' },
      {
        $addFields: {
          _id: '$followerId._id',
          username: '$authId.username',
          avatarColor: '$authId.avatarColor',
          uId: '$authId.uId',
          postCount: '$followerId.postsCount',
          followersCount: '$followerId.followersCount',
          followingCount: '$followerId.followingCount',
          profilePicture: '$followerId.profilePicture',
          userProfile: '$followerId'
        }
      },
      {
        $project: {
          authId: 0,
          followerId: 0,
          followeeId: 0,
          createdAt: 0,
          __v: 0
        }
      }
    ]);
    return follower;
  }

  // Get id of all other users who are following this user
  // EG : we can find all ids of users following the logged in user
  public async getFolloweesIds(userId: string): Promise<string[]> {
    const followee = await FollowerModel.aggregate([
      { $match: { followerId: new mongoose.Types.ObjectId(userId)}},
      {
        $project: {
          followeeId: 1,
          _id: 0
        }
      }
    ]);
    return map(followee, (result) => result.followeeId.toString());
  }
}

export const followerService: FollowerService = new FollowerService();
