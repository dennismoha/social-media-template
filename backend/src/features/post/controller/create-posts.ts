import { ObjectId } from 'mongodb';
import HTTP_STATUS from 'http-status-codes';
import { IPostDocument } from '@src/features/post/interfaces/post.interface';
import { postSchema, postWithImageSchema } from '@src/features/post/schemes/post.schemes';
import { joiValidation } from '@src/shared/globals/decorators/joi-validation-decorators';
import { Request, Response } from 'express';
import { PostCache } from '@src/shared/services/redis/post.cache';
import { SocketIOPostObject } from '@src/shared/sockets/posts';
import { postQueue } from '@src/shared/services/queues/post.queue';
import { ADD_IMAGE_TO_DB_JOB, ADD_USER_POST_TO_JOB } from '@src/constants';
import { UploadApiResponse } from 'cloudinary';
import { uploads } from '@src/shared/globals/helpers/cloudinary-upload';
import { BadRequestError } from '@src/shared/globals/helpers/error-handler';
import { imageQueue } from '@src/shared/services/queues/image.queue';

const postCache: PostCache = new PostCache();

export class CreatePost {
  // handles user post without an image
  @joiValidation(postSchema)
  public async post(req: Request, res: Response): Promise<void> {
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
      uId: `${req.currentUser!.userId}`,
      createdPost
    });

    // this can be either before saving to cache or after.
    SocketIOPostObject.emit('add post', createdPost);
    postQueue.AddPostJob(ADD_USER_POST_TO_JOB, { key: req.currentUser!.userId, value: createdPost });
    res.status(HTTP_STATUS.CREATED).json(createdPost);
  }

  // Handles user post that contains an image
  @joiValidation(postWithImageSchema)
  public async postWithImage(req: Request, res: Response): Promise<void> {
    const { post, bgColor, privacy, gifUrl, profilePicture, feelings, image } = req.body;

    // upload to cloudinary

    /*

    Here unlike the signup we don't pass three params on the uploads since here we allow cloudinary to generate
          1) the image IDs
          2) the version
       for us.

    */
    const result: UploadApiResponse = (await uploads(image)) as UploadApiResponse;

    if (!result?.public_id) {
      throw new BadRequestError(result.message);
    }

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
      imgVersion: result.version.toString(),
      imgId: result.public_id,
      videoId: '',
      videoVersion: '',
      createdAt: new Date(),
      reactions: { like: 0, love: 0, happy: 0, sad: 0, wow: 0, angry: 0 }
    } as IPostDocument;

    await postCache.savePostToCache({
      key: postObjectId,
      currentUserId: `${req.currentUser!.userId}`,
      uId: `${req.currentUser!.userId}`,
      createdPost
    });

    // this can be either before saving to cache or after.
    SocketIOPostObject.emit('add post', createdPost);
    postQueue.AddPostJob(ADD_USER_POST_TO_JOB, { key: req.currentUser!.userId, value: createdPost });

    // call image queue to add image to mongodb database
    imageQueue.addImageJob(ADD_IMAGE_TO_DB_JOB, {
      key: `${req.currentUser!.userId}`,
      imgId: result.public_id,
      imgVersion: result.version.toString()
    });

    res.status(HTTP_STATUS.CREATED).json({ message: 'posts created with image successfull ', createdPost });
  }
}
