import { BaseCache } from '@src/shared/services/redis/base.cache';
import Logger from 'bunyan';


import { config } from '@src/config';

import { ServerError } from '@src/shared/globals/helpers/error-handler';
import { IFollowerData } from '@src/features/follower/interfaces/follower.interface';
import { IUserDocument } from '@src/features/user/interfaces/user.interface';
import { UserCache } from '@src/shared/services/redis/user.cache';
import mongoose from 'mongoose';

const userCache: UserCache = new UserCache();
const log: Logger = config.createLogger('followersCache');

export class FollowersCache extends BaseCache {
  constructor() {
    super('followersCache');
  }

  /*
    save follower to cache
    We are only saving the ID of user1 and user2

  */

  public async saveFollowerToCache(key: string, value: string): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      await this.client.LPUSH(key, value);
    } catch (error) {
      log.error('save follower to cache error: ',error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async removeFollowerFromCache(key: string, value: string): Promise<void> {
    try {
      if(!this.client.isOpen) {
        await this.client.connect();
      }
      await this.client.LREM(key, 1, value);
    } catch (error) {
      log.error('remove follower from cache error: ',error);
      throw new ServerError('Server error. Try again.');
    }
  }

  /*
     The user model got two fields. one for followers and the other for following
     So after adding followers we need to update those two fields for each user
  */
  public async updateFollowersCountInCache(userId: string, prop: string, value: number): Promise<void> {

    /*
        prop here stands for the name of the propery i n the user model that we want to update
        in our case here it's the followers and the followee

        The value stands for the value we want to add in our property

    */

    try {
      if(!this.client.isOpen) {
        await this.client.connect();
      }

      // HINCRBY increments the value of a field inside the hash

      await this.client.HINCRBY(`users:${userId}`, prop, value);
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  // get followers / following data for a user
    public async getFollowersFromCache(key: string): Promise<IFollowerData[]> {
    try {
      if(!this.client.isOpen) {
        await this.client.connect();
      }

      // get every follower item of the user in this list
      // you can also implement pagination here by defining the start and the end

      const response: string[] = await this.client.LRANGE(key, 0, -1);
      const list: IFollowerData[] = [];

      //we loop through each id and fetch the corresponding details of that user from cache
      for(const item of response) {
        const user: IUserDocument = await userCache.getUserFromCache(item) as IUserDocument;
        const data: IFollowerData = {
          _id: new mongoose.Types.ObjectId(user._id),
          username: user.username!,
          avatarColor: user.avatarColor!,
          postCount: user.postsCount,
          followersCount: user.followersCount,
          followingCount: user.followingCount,
          profilePicture: user.profilePicture,
          uId: user.uId!,
          userProfile: user
        };
        list.push(data);
      }
      return list;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }
}
