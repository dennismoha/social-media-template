import { BaseCache } from '@src/shared/services/redis/base.cache';
import Logger from 'bunyan';


import { config } from '@src/config';

import { ServerError } from '@src/shared/globals/helpers/error-handler';


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
}
