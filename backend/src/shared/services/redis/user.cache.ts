import { RedisCommandRawReply } from '@redis/client/dist/lib/commands';
import { INotificationSettings, ISocialLinks, IUserDocument } from '@src/features/user/interfaces/user.interface';
import { BaseCache } from '@src/shared/services/redis/base.cache';
import Logger from 'bunyan';
import { config } from '@src/config';
import { ServerError } from '@src/shared/globals/helpers/error-handler';
import { Helpers } from '@src/shared/globals/helpers/helpers';
import { findIndex, indexOf } from 'lodash';


const log: Logger = config.createLogger('userCache');

type UserItem = string | ISocialLinks | INotificationSettings;
type UserCacheMultiType = string | number | Buffer | RedisCommandRawReply[] | IUserDocument | IUserDocument[];

export class UserCache  extends BaseCache{
  constructor(){
    super('userCache');
  }

  public async saveUserToCache(key: string, userUId: string, createdUser: IUserDocument): Promise<void>{
    const createdAt = new Date();
    const{
      _id,
      uId,
      username,
      email,
      avatarColor,
      blocked,
      blockedBy,
      postsCount,
      profilePicture,
      followersCount,
      followingCount,
      notifications,
      work,
      location,
      school,
      quote,
      bgImageId,
      bgImageVersion,
      social
    } = createdUser;
    const firstList: string[] = [
      '_id',
      `${_id}`,
      'uId',
      `${uId}`,
      'username',
      `${username}`,
      'email',
      `${email}`,
      'avatarColor',
      `${avatarColor}`,
      'createdAt',
      `${createdAt}`,
      'postsCount',
      `${postsCount}`
    ];
    const secondList: string[] = [
      'blocked',
      JSON.stringify(blocked),
      'blockedBy',
      JSON.stringify(blockedBy),
      'profilePicture',
      `${profilePicture}`,
      'followersCount',
      `${followersCount}`,
      'followingCount',
      `${followingCount}`,
      'notifications',
      JSON.stringify(notifications),
      'social',
      JSON.stringify(social)
    ];
    const thirdList: string[] = [
      'work',
      `${work}`,
      'location',
      `${location}`,
      'school',
      `${school}`,
      'quote',
      `${quote}`,
      'bgImageVersion',
      `${bgImageVersion}`,
      'bgImageId',
      `${bgImageId}`
    ];

    const dataToSave: string[] = [...firstList, ...secondList, ...thirdList];

    try {
      if(!this.client.isOpen){
        await this.client.connect();
      }

      await this.client.ZADD('user', {score: parseInt(userUId, 10), value: `${key}`});
      await this.client.HSET(`users:${key}`, dataToSave);
    } catch (error) {
      log.error(error);
      throw new ServerError('Redis server error. Try again');
    }

  }

  // fetch the cached user data from redis
  public async getUserFromCache(userId: string): Promise<IUserDocument | null > {
    try {
      if(!this.client.isOpen){
        await this.client.connect();
      }

      // in the hgetall function be aware of how the user id syntax is as in the redis eg: users:65b8d23e94fda8496b2dab56
      const response: IUserDocument = await this.client.HGETALL(`users:${userId}`) as unknown as IUserDocument;

      // NB: we only parsed as json for whatever is not sufficient to be a string

      response.createdAt = new Date(Helpers.parseJson(`${response.createdAt}`));
      response.postsCount = Helpers.parseJson(`${response.postsCount}`);
      response.blocked = Helpers.parseJson(`${response.blocked}`);
      response.blockedBy = Helpers.parseJson(`${response.blockedBy}`);
      response.notifications = Helpers.parseJson(`${response.notifications}`);
      response.social = Helpers.parseJson(`${response.social}`);
      response.followersCount = Helpers.parseJson(`${response.followersCount}`);
      response.followingCount = Helpers.parseJson(`${response.followingCount}`);
      response.bgImageId = Helpers.parseJson(`${response.bgImageId}`);
      response.bgImageVersion = Helpers.parseJson(`${response.bgImageVersion}`);
      response.profilePicture = Helpers.parseJson(`${response.profilePicture}`);
      response.work = Helpers.parseJson(`${response.work}`);
      response.school = Helpers.parseJson(`${response.school}`);
      response.location = Helpers.parseJson(`${response.location}`);
      response.quote = Helpers.parseJson(`${response.quote}`);

      return response;
    } catch (error) {
      log.error(error);
      throw new ServerError('Redis server error. Try again');
    }
  }

  // utility function to update values in cache
  public async updateSingleUserItemInCache(userId: string, prop: string, value: UserItem): Promise<IUserDocument | null> {
    // prop above means the property in cache that we are updating
    // value is the value for that data that we are updating it with
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      // save the user data to cache
      await this.client.HSET(`users:${userId}`, `${prop}`, JSON.stringify(value));

      // fetch the saved in user data from cache and return it
      const response: IUserDocument = (await this.getUserFromCache(userId)) as IUserDocument;
      return response;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  //
  public async getUsersFromCache(start: number, end: number, excludedUserKey: string): Promise<IUserDocument[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const response: string[] = await this.client.ZRANGE('user', start, end);
      // const reply: string[] = await this.client.ZRANGE(key, start, end);
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      for(const key of response) {
        if(key !== excludedUserKey) {
          multi.HGETALL(`users:${key}`);
        }
      }
      const replies: UserCacheMultiType = await multi.exec() as UserCacheMultiType;
      const userReplies: IUserDocument[] = [];
      for(const reply of replies as IUserDocument[]) {
        reply.createdAt = new Date(Helpers.parseJson(`${reply.createdAt}`));
        reply.postsCount = Helpers.parseJson(`${reply.postsCount}`);
        reply.blocked = Helpers.parseJson(`${reply.blocked}`);
        reply.blockedBy = Helpers.parseJson(`${reply.blockedBy}`);
        reply.notifications = Helpers.parseJson(`${reply.notifications}`);
        reply.social = Helpers.parseJson(`${reply.social}`);
        reply.followersCount = Helpers.parseJson(`${reply.followersCount}`);
        reply.followingCount = Helpers.parseJson(`${reply.followingCount}`);
        reply.bgImageId = Helpers.parseJson(`${reply.bgImageId}`);
        reply.bgImageVersion = Helpers.parseJson(`${reply.bgImageVersion}`);
        reply.profilePicture = Helpers.parseJson(`${reply.profilePicture}`);

        userReplies.push(reply);
      }
      return userReplies;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  // Returns a list of random users from cache
  // the logged in user has got no affilliation in the manner of being a follower of any user.

  public async getRandomUsersFromCache(userId: string, excludedUsername: string): Promise<IUserDocument[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const replies: IUserDocument[] = [];

      // first of all get the followers of the currently logged in user
      const followers: string[] = await this.client.LRANGE(`followers:${userId}`, 0, -1);

      // fetch all users from the sorted set
      const users: string[] = await this.client.ZRANGE('user', 0, -1);

        // randomly shuffles a list and randomly selects an item
      const randomUsers: string[] = Helpers.shuffle(users).slice(0, 10);

      // check if any randomly selected user is part of the users follower
      for(const key of randomUsers) {
        const followerIndex = indexOf(followers, key);

        // if no random selected user is part of the logged in users follower, userIndex will return < 0 else more than o
        if (followerIndex < 0) {
          const userHash: IUserDocument = await this.client.HGETALL(`users:${key}`) as unknown as IUserDocument;
          replies.push(userHash);
        }
      }

      // find the index of the logged in user if it exists
      const excludedUsernameIndex: number = findIndex(replies, ['username', excludedUsername]);
      //  then exclude username of the logged in user if maybe
      replies.splice(excludedUsernameIndex, 1);
      for(const reply of replies) {
        reply.createdAt = new Date(Helpers.parseJson(`${reply.createdAt}`));
        reply.postsCount = Helpers.parseJson(`${reply.postsCount}`);
        reply.blocked = Helpers.parseJson(`${reply.blocked}`);
        reply.blockedBy = Helpers.parseJson(`${reply.blockedBy}`);
        reply.notifications = Helpers.parseJson(`${reply.notifications}`);
        reply.social = Helpers.parseJson(`${reply.social}`);
        reply.followersCount = Helpers.parseJson(`${reply.followersCount}`);
        reply.followingCount = Helpers.parseJson(`${reply.followingCount}`);
        reply.bgImageId = Helpers.parseJson(`${reply.bgImageId}`);
        reply.bgImageVersion = Helpers.parseJson(`${reply.bgImageVersion}`);
        reply.profilePicture = Helpers.parseJson(`${reply.profilePicture}`);
      }
      return replies;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }



  // get total users
  // we get the count of items in the sorted set
  public async getTotalUsersInCache(): Promise<number> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
        // we get the count of items in the sorted set using the ZCARD
      const count: number = await this.client.ZCARD('user');
      return count;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }


}
