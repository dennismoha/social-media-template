import { BaseCache } from '@src/shared/services/redis/base.cache';
import Logger from 'bunyan';
import { RedisCommandRawReply } from '@redis/client/dist/lib/commands';

import { config } from '@src/config';
import { IPostDocument, IReactions, ISavePostToCache } from '@src/features/post/interfaces/post.interface';
import { ServerError } from '@src/shared/globals/helpers/error-handler';
import { Helpers } from '@src/shared/globals/helpers/helpers';

const log: Logger = config.createLogger('userCache');
export type PostCacheMultiType = string | number | Buffer | RedisCommandRawReply[] | IPostDocument | IPostDocument[];

export class PostCache extends BaseCache {
  constructor() {
    super('postCache');
  }

  public async savePostToCache(data: ISavePostToCache): Promise<void> {
    const { key, currentUserId, uId, createdPost } = data;

    const {
      _id,
      userId,
      username,
      email,
      avatarColor,
      profilePicture,
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      commentsCount,
      imgVersion,
      imgId,
      reactions,
      createdAt
    } = createdPost;

    const firstList: string[] = [
      '_id',
      `${_id}`,
      'userId',
      `${userId}`,
      'username',
      `${username}`,
      'email',
      `${email}`,
      'avatarColor',
      `${avatarColor}`,
      'profilePicture',
      `${profilePicture}`,
      'post',
      `${post}`,
      'bgColor',
      `${bgColor}`,
      'feelings',
      `${feelings}`,
      'privacy',
      `${privacy}`,
      'gifUrl',
      `${gifUrl}`
    ];

    const secondList: string[] = [
      'commentsCount',
      `${commentsCount}`,
      'reactions',
      JSON.stringify(reactions),
      'imgVersion',
      `${imgVersion}`,
      'imgId',
      `${imgId}`,
      'createdAt',
      `${createdAt}`
    ];
    const dataToSave: string[] = [...firstList, ...secondList];

    // When creating a new post, we have to update the number of posts for the user
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      // so we first fetch the postsCount from the cache
      const postCount: string[] = await this.client.HMGET(`users:${currentUserId}`, 'postsCount');

      /*
              we can use redis multi to combine three commands and execute all at once instead of a single command
              at a time using await. That is instead of doing it as :
              await this.client.ZADD('post', {score: parseInt(uId, 10), value: `${key}`});

      */

      const multi: ReturnType<typeof this.client.multi> = this.client.multi();

      // we create a set for the post
      multi.ZADD('post', { score: parseInt(uId, 10), value: `${key}` });

      // set the redis hash for the post
      multi.HSET(`posts:${key}`, dataToSave); // key here is the post id

      // since data in redis is saved as strings, so postCount will be a string so we convert it to a number:
      const count: number = parseInt(postCount[0], 10) + 1;

      // will update the post count hash in the users hash

      multi.HSET(`users:${currentUserId}`, ['postsCount', count]);

      // we execute the all functions

      multi.exec();
    } catch (error) {
      log.error('error', 'redis connection for post caching error');
      throw new ServerError('Server error. Try again');
    }
  }

  // Retrieve total number of  posts from cache

  public async getTotlaNumberOfPostsFromCache(): Promise<number> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const count: number = await this.client.ZCARD('post');
      return count;
    } catch (error) {
      log.error('error', 'redis connection for fetching totla number of post caching error');
      throw new ServerError('Server error. Try again');
    }
  }

  // Retrieve total number of  posts of a particular user from cache

  public async getTotalNumberOfaUserPostsFromCache(uId: number): Promise<number> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const count: number = await this.client.ZCOUNT('posts', uId, uId);
      return count;
    } catch (error) {
      log.error('error', 'redis connection for fetching totla number of post caching error');
      throw new ServerError('Server error. Try again');
    }
  }

  // Retrieve posts from cache
  // This is done using pagination. We cannot retrieve all posts at once . that's expensive
  public async getPostsFromCache(key: string, start: number, end: number): Promise<IPostDocument[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      // return a number of posts we first of all get their hash values from the set using the ZRange
      // ZRANGE returns an array of sets.
      // REV key returns them in reversed order. which means from the one latest added

      // this throws out an error which I have to sit down and settle
     // const reply: string[] = await this.client.ZRANGE(key, start, end, { REV: true });
      const reply: string[] = await this.client.ZRANGE(key, start, end);

      /*
        To get multiple posts from multiple hashes, we cannot use
            "await client.HGETALL()"  since this will require one hash at a time,
        we use  for loop to loop through the array of reply and for each array
        we use multi.HGETAll.
        Multi is simmilar to the concept of promise.all

    */

      // initialize multi
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();

      //loop through the replies

      for (const value of reply) {
        multi.HGETALL(`posts:${value}`);
      }

      // execure multi
      const replies: PostCacheMultiType = (await multi.exec()) as PostCacheMultiType;

      const postReplies: IPostDocument[] = [];

      // convert some values from strings to their respective number types

      for (const post of replies as IPostDocument[]) {
        post.commentsCount = Helpers.parseJson(`${post.commentsCount}`) as number;
        post.reactions = Helpers.parseJson(`${post.reactions}`) as IReactions;
        post.createdAt = new Date(Helpers.parseJson(`${post.createdAt}`));
        postReplies.push(post);
      }

      return postReplies;
    } catch (error) {
      log.error('error', 'redis connection for fetching post from cache error');
      throw new ServerError('Server error. Try again');
    }
  }

  // Retrieve posts With Images from cache
  // This is done using pagination. We cannot retrieve all posts at once . that's expensive
  public async getPostsWithImagesFromCache(key: string, start: number, end: number): Promise<IPostDocument[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      // return a number of posts we first of all get their hash values from the set using the ZRange
      // ZRANGE returns an array of sets.
      // REV key returns them in reversed order. which means from the one latest added

      // will check on why rev is not working
      //const reply: string[] = await this.client.ZRANGE(key, start, end, { REV: true });
      const reply: string[] = await this.client.ZRANGE(key, start, end);

      /*
        To get multiple posts from multiple hashes, we cannot use
            "await client.HGETALL()"  since this will require one hash at a time,
        we use  for loop to loop through the array of reply and for each array
        we use multi.HGETAll.
        Multi is simmilar to the concept of promise.all

    */

      // initialize multi
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();

      //loop through the replies

      for (const value of reply) {
        multi.HGETALL(`posts:${value}`);
      }

      // execure multi
      const replies: PostCacheMultiType = (await multi.exec()) as PostCacheMultiType;

      const postWithImages: IPostDocument[] = [];

      // convert some values from strings to their respective number types

      for (const post of replies as IPostDocument[]) {
        if ((post.imgId && post.imgVersion) || post.gifUrl) {
          post.commentsCount = Helpers.parseJson(`${post.commentsCount}`) as number;
          post.reactions = Helpers.parseJson(`${post.reactions}`) as IReactions;
          post.createdAt = new Date(Helpers.parseJson(`${post.createdAt}`));
          postWithImages.push(post);
        }
      }

      return postWithImages;
    } catch (error) {
      log.error('error', 'redis connection for fetching post from cache error');
      throw new ServerError('Server error. Try again');
    }
  }

  // Retrieve posts of a particular user  from cache
  // This is done using pagination. We cannot retrieve all posts at once . that's expensive
  public async getUserPostsFromCache(key: string, uid: number): Promise<IPostDocument[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      // return a number of posts we first of all get their hash values from the set using the ZRange
      // ZRANGE returns an array of sets.
      // REV key returns them in reversed order. which means from the one latest added

      const reply: string[] = await this.client.ZRANGE(key, uid, uid, { REV: true, BY: 'SCORE' });

      /*
        To get multiple posts from multiple hashes, we cannot use
            "await client.HGETALL()"  since this will require one hash at a time,
        we use  for loop to loop through the array of reply and for each array
        we use multi.HGETAll.
        Multi is simmilar to the concept of promise.all

    */

      // initialize multi
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();

      //loop through the replies

      for (const value of reply) {
        multi.HGETALL(`posts:${value}`);
      }

      // execure multi
      const replies: PostCacheMultiType = (await multi.exec()) as PostCacheMultiType;

      const postRepliesFromUser: IPostDocument[] = [];

      // convert some values from strings to their respective number types

      for (const post of replies as IPostDocument[]) {
        post.commentsCount = Helpers.parseJson(`${post.commentsCount}`) as number;
        post.reactions = Helpers.parseJson(`${post.reactions}`) as IReactions;
        post.createdAt = new Date(Helpers.parseJson(`${post.createdAt}`));
        postRepliesFromUser.push(post);
      }

      return postRepliesFromUser;
    } catch (error) {
      log.error('error', 'redis connection for fetching post from cache error');
      throw new ServerError('Server error. Try again');
    }
  }
}
