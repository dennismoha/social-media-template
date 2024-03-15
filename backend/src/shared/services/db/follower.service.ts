import { IFollowerDocument } from '@src/features/follower/interfaces/follower.interface';
import { FollowerModel } from '@src/features/follower/models/follower.schema';
import { IQueryComplete, IQueryDeleted } from '@src/features/post/interfaces/post.interface';
import { UserModel } from '@src/features/user/models/user.schema';
import { ObjectId, BulkWriteResult } from 'mongodb';
import mongoose, { Query } from 'mongoose';

class FollowerService {
  public async addFollowerToDB(userId: string, followeeId: string, username: string, followerDocumentId: ObjectId): Promise<void> {
    const followeeObjectId: ObjectId = new mongoose.Types.ObjectId(followeeId);
    const followerObjectId: ObjectId = new mongoose.Types.ObjectId(userId);

    // we create a new document inside the follower collection

    await FollowerModel.create({
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

    await Promise.all([users, UserModel.findOne({ _id: followeeId })]);
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
}

export const followerService: FollowerService = new FollowerService();
