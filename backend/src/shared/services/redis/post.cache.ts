
import { BaseCache } from '@src/shared/services/redis/base.cache';
import Logger from 'bunyan';
import { ISavePostToCache } from '@src/features/post/interfaces/Post.interface';
import { config } from '@src/config';




const log: Logger = config.createLogger('userCache');

export  class PostCache extends BaseCache {
  constructor(){
    super('postCache');
  }

  public async savePostToCache(data: ISavePostToCache): Promise<void>{
    const {key, currentUserId, uId, createdPost} = data;

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
      if(!this.client.isOpen){
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
      multi.ZADD('post', {score: parseInt(uId, 10), value: `${key}`});

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
    }
  }
}
