import { BaseCache } from '@src/shared/services/redis/base.cache';
import Logger from 'bunyan';
import { find } from 'lodash';


import { config } from '@src/config';

import { ServerError } from '@src/shared/globals/helpers/error-handler';
import { Helpers } from '@src/shared/globals/helpers/helpers';
import { ICommentDocument, ICommentNameList } from '@src/features/comments/interfaces/comment.interface';


const log: Logger = config.createLogger('commentsCache');


export class CommentsCache extends BaseCache {
  constructor() {
    super('commentsCache');
  }

  public async savePostCommentToCache(postId: string, value: string): Promise<void> {
    try {
      if(!this.client.isOpen) {
        await this.client.connect();
      }

      // save the comments in a list. NB:
      await this.client.LPUSH(`comments:${postId}`, value);

      // Then we fetch the post from the post cache for which that comment was added and increment the comment count
      const commentsCount: string[] = await this.client.HMGET(`posts:${postId}`, 'commentsCount');
      // convert the comments count from string to number.
      let count: number = Helpers.parseJson(commentsCount[0]) as number;
      count += 1;
      // Then we save it back
      // const dataToSave: string[] = [];
      await this.client.HSET(`posts:${postId}`, 'commentsCount', `${count}`);
    } catch (error) {
      log.error('saving comments error',error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async getCommentsFromCache(postId: string): Promise<ICommentDocument[]> {
    try {
      if(!this.client.isOpen) {
        await this.client.connect();
      }

      // we use LRANGE to fetch all comments in the list of a particular post.
      const reply: string[] = await this.client.LRANGE(`comments:${postId}`, 0, -1);
      const list: ICommentDocument[] = [];

      // since the item is stringified we parse each item in the array from string to json
      for(const item of reply) {
        list.push(Helpers.parseJson(item));
      }
      return list;
    } catch (error) {
      log.error('error fetching comments: ',error);
      throw new ServerError('Server error. Try again.');
    }
  }

  // fetch names of all users that added a comment to a particular post

  public async getCommentsNamesFromCache(postId: string): Promise<ICommentNameList[]> {
    try {
      if(!this.client.isOpen) {
        await this.client.connect();
      }

      // get the length  of the list containing comments of that specific post.
      const commentsCount: number = await this.client.LLEN(`comments:${postId}`);

      //fetch all the comments of that specific post
      const comments: string[] = await this.client.LRANGE(`comments:${postId}`, 0, -1);
      const list: string[] = [];

      // parse them from string to json and for each comment item push the username key to the list array
      for(const item of comments) {
        const comment: ICommentDocument = Helpers.parseJson(item) as ICommentDocument;
        list.push(comment.username);
      }
      const response: ICommentNameList = {
        count: commentsCount,
        names: list
      };
      return [response];
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  // method to get a single comment from cache
  public async getSingleCommentFromCache(postId: string, commentId: string): Promise<ICommentDocument[]> {
    try {
      if(!this.client.isOpen) {
        await this.client.connect();
      }

      //retrieve all comments from the comments list
      const comments: string[] = await this.client.LRANGE(`comments:${postId}`, 0, -1);

      // parse them from string to json
      const list: ICommentDocument[] = [];
      for(const item of comments) {
        list.push(Helpers.parseJson(item));
      }

      // return only that comment for which list item id of the total comments is === to the comment id
      const result: ICommentDocument = find(list, (listItem: ICommentDocument) => {
        return listItem._id === commentId;
      }) as ICommentDocument;

      return [result];
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }



}
