import HTTP_STATUS from 'http-status-codes';

import { Request, Response } from 'express';
import { PostCache } from '@src/shared/services/redis/post.cache';
import { SocketIOPostObject } from '@src/shared/sockets/posts';
import { postQueue } from '@src/shared/services/queues/post.queue';
import { DELETE_USER_POST_TO_JOB } from '@src/constants';

const postCache: PostCache = new PostCache();

export class DeletePost {
  // delete user post

  public async deletePost(req: Request, res: Response): Promise<void> {
    // .
    SocketIOPostObject.emit('delete post', req.params.postId);
    postCache.deletePostsFromCache(req.params.postId, `${req.currentUser!.userId}`);
    postQueue.AddPostJob(DELETE_USER_POST_TO_JOB, { keyOne: req.params.postId, keyTwo: req.currentUser!.userId });
    res.status(HTTP_STATUS.CREATED).json({ message: 'post deleted successfully' });
  }
}
