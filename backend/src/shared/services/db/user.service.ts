import mongoose from 'mongoose';
import { IBasicInfo, INotificationSettings, ISearchUser, ISocialLinks, IUserDocument } from '@src/features/user/interfaces/user.interface';
import { UserModel } from '@src/features/user/models/user.schema';
import { IAuthDocument } from '@src/interfaces/auth.interface';
import Logger from 'bunyan';

import { config } from '@src/config';
import { indexOf } from 'lodash';
import { followerService } from '@src/shared/services/db/follower.service';
import { AuthModel } from '@src/features/auth/models/auth.schema';

const log: Logger = config.createLogger('singup');

class UserService {
  // this methods creates a user to the db:
  // we use it in our auth.worker.ts

  public async addUserData(data: IAuthDocument): Promise<void> {
    log.error('add user data to db ', data);
    await UserModel.create(data);
  }

  // update user password once user is logged in
  // public async updatePassword(userId: string, hashedPassword: string): Promise<void>{
  //   await UserModel.updateOne({_id: userId}, {$set: {pasword: hashedPassword}}).exec();
  // }

  // update user password once user is logged in
  public async updateUserInfo(userId: string, info: IBasicInfo): Promise<void> {
    await UserModel.updateOne(
      { _id: userId },
      {
        $set: {
          work: info['work'],
          school: info['school'],
          quote: info['quote'],
          location: info['location']
        }
      }
    ).exec();
  }

  public async updateSocialLinks(userId: string, links: ISocialLinks): Promise<void> {
    await UserModel.updateOne(
      { _id: userId },
      {
        $set: { social: links }
      }
    ).exec();
  }

  public async updateNotificationSettings(userId: string, settings: INotificationSettings): Promise<void> {
    await UserModel.updateOne({ _id: userId }, { $set: { notifications: settings }}).exec();
  }


  public async getUserById(userId: string): Promise<IUserDocument> {
    const users: IUserDocument[] = await UserModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      { $lookup: { from: 'Auth', localField: 'authId', foreignField: '_id', as: 'authId' } },
      { $unwind: '$authId' },
      { $project: this.aggregateProject() }
    ]);
    return users[0];
  }
  public async getUserByAuthId(authId: string): Promise<IUserDocument> {
    const users: IUserDocument[] = await UserModel.aggregate([
      { $match: { authId: new mongoose.Types.ObjectId(authId) } },
      { $lookup: { from: 'Auth', localField: 'authId', foreignField: '_id', as: 'authId' } },
      { $unwind: '$authId' },
      { $project: this.aggregateProject() }
    ]);
    return users[0];
  }

  // fetch users with an exception to logged in users
  // skip and limit are for the pagination purposes
  public async getAllUsers(userId: string, skip: number, limit: number): Promise<IUserDocument[]> {
    const users: IUserDocument[] = await UserModel.aggregate([
      { $match: { _id: { $ne: new mongoose.Types.ObjectId(userId) } } }, // return all other documents not equal to the logged in user
      { $skip: skip },
      { $limit: limit },
      { $sort: { createdAt: -1 } },
      { $lookup: { from: 'Auth', localField: 'authId', foreignField: '_id', as: 'authId' } },
      { $unwind: '$authId' },
      { $project: this.aggregateProject() }
    ]);
    return users;
  }

  public async getRandomUsers(userId: string): Promise<IUserDocument[]> {
    const randomUsers: IUserDocument[] = [];
    const users: IUserDocument[] = await UserModel.aggregate([
      { $match: { _id: { $ne: new mongoose.Types.ObjectId(userId) } } }, // return all other documents not equal to the logged in user
      { $lookup: { from: 'Auth', localField: 'authId', foreignField: '_id', as: 'authId' } },
      { $unwind: '$authId' },
      { $sample: { size: 10 } }, // sample operator help return a list of 10 users randomly selected from db. it takes size parameter
      {
        // these will come from Auth
        $addFields: {
          username: '$authId.username',
          email: '$authId.email',
          avatarColor: '$authId.avatarColor',
          uId: '$authId.uId',
          createdAt: '$authId.createdAt'
        }
      },
      {
        $project: {
          authId: 0,
          __v: 0
        }
      }
    ]);
    const followers: string[] = await followerService.getFolloweesIds(`${userId}`);
    for (const user of users) {
      const followerIndex = indexOf(followers, user._id.toString());
      if (followerIndex < 0) {
        randomUsers.push(user);
      }
    }
    return randomUsers;
  }

  // utility function to get total number of users in the db
  public async getTotalUsersInDB(): Promise<number> {
    const totalCount: number = await UserModel.find({}).countDocuments();
    return totalCount;
  }

  // search for user.
  // used during chat to search for a user in the users to chat with
  public async searchUsers(regex: RegExp): Promise<ISearchUser[]> {

    const users = await AuthModel.aggregate([
      { $match: { username: regex } },
      { $lookup: { from: 'User', localField: '_id', foreignField: 'authId', as: 'user' } },
      { $unwind: '$user' },
      {
        $project: {
          _id: '$user._id',
          username: 1,
          email: 1,
          avatarColor: 1,
          profilePicture: 1
        }
      }
    ]);
    return users;
  }

  private aggregateProject() {
    return {
      _id: 1,
      username: '$authId.username',
      uId: '$authId.uId',
      email: '$authId.email',
      avatarColor: '$authId.avatarColor',
      createdAt: '$authId.createdAt',
      postsCount: 1,
      work: 1,
      school: 1,
      quote: 1,
      location: 1,
      blocked: 1,
      blockedBy: 1,
      followersCount: 1,
      followingCount: 1,
      notifications: 1,
      social: 1,
      bgImageVersion: 1,
      bgImageId: 1,
      profilePicture: 1
    };
  }
}

export const userService: UserService = new UserService();
