import { INotificationSettings, ISocialLinks, IUserDocument } from '@src/features/user/interfaces/user.interface';
import { BaseCache } from '@src/shared/services/redis/base.cache';
import Logger from 'bunyan';
import { config } from '@src/config';
import { ServerError } from '@src/shared/globals/helpers/error-handler';
import { Helpers } from '@src/shared/globals/helpers/helpers';


const log: Logger = config.createLogger('userCache');

type UserItem = 'string' | ISocialLinks | INotificationSettings;

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


}
