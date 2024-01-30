import mongoose from 'mongoose';
import { IUserDocument } from '@src/features/user/interfaces/user.interface';
import { UserModel } from '@src/features/user/models/user.schema';
import { IAuthDocument } from '@src/interfaces/auth.interface';
import Logger from 'bunyan';

import { config } from '@src/config';



const log: Logger = config.createLogger('singup');

class UserService {
  // this methods creates a user to the db:
  // we use it in our auth.worker.ts

  public async addUserData(data: IAuthDocument): Promise<void> {
    log.error('add user data to db ', data);
    await UserModel.create(data);
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
