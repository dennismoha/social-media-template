
import { ObjectId } from 'mongodb';
import HTTP_STATUS  from 'http-status-codes';
import { IPostDocument } from '@src/features/post/interfaces/post.interface';
import { postSchema } from '@src/features/post/schemes/post.schemes';
import { joiValidation } from '@src/shared/globals/decorators/joi-validation-decorators';
import { Request, Response } from 'express';
import { PostCache } from '@src/shared/services/redis/post.cache';
import { SocketIOPostObject } from '@src/shared/sockets/posts';



const postCache:PostCache = new PostCache();


export class CreatePost {
  @joiValidation(postSchema)
  public async post(req: Request, res: Response): Promise<void>{
    const { post, bgColor, privacy, gifUrl, profilePicture, feelings } = req.body;
    const postObjectId: ObjectId = new ObjectId();
    const createdPost: IPostDocument = {
      _id: postObjectId,
      userId: req.currentUser!.userId,
      username: req.currentUser!.username,
      email: req.currentUser!.email,
      avatarColor: req.currentUser!.avatarColor,
      profilePicture,
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      commentsCount: 0,
      imgVersion: '',
      imgId: '',
      videoId: '',
      videoVersion: '',
      createdAt: new Date(),
      reactions: { like: 0, love: 0, happy: 0, sad: 0, wow: 0, angry: 0 }
    } as IPostDocument;

    await postCache.savePostToCache({
      key: postObjectId,
      currentUserId: `${req.currentUser!.userId}`,
      uId:  `${req.currentUser!.userId}`,
      createdPost
    });

    // this can be either before saving to cache or after.
    SocketIOPostObject.emit('add post', createdPost);
    res.status(HTTP_STATUS.CREATED).json(createdPost);
  }
}
