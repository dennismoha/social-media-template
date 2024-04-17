import HTTP_STATUS from 'http-status-codes';
import { IPostDocument } from '@src/features/post/interfaces/post.interface';
import { postSchema, postWithImageSchema, postWithVideoSchema } from '@src/features/post/schemes/post.schemes';
import { joiValidation } from '@src/shared/globals/decorators/joi-validation-decorators';
import { Request, Response } from 'express';
import { PostCache } from '@src/shared/services/redis/post.cache';
import { SocketIOPostObject } from '@src/shared/sockets/posts';
import { postQueue } from '@src/shared/services/queues/post.queue';
import { ADD_IMAGE_TO_DB_JOB, EDIT_USER_POST_TO_JOB } from '@src/constants';
import { UploadApiResponse } from 'cloudinary';
import { uploads, videoUpload } from '@src/shared/globals/helpers/cloudinary-upload';
import { BadRequestError } from '@src/shared/globals/helpers/error-handler';
import { imageQueue } from '@src/shared/services/queues/image.queue';

const postCache: PostCache = new PostCache();

export class UpdatePost {
  // handles updating user post without an image
  @joiValidation(postSchema)
  public async post(req: Request, res: Response): Promise<void> {
    const { post, bgColor, feelings, privacy, gifUrl, imgVersion, imgId, profilePicture, videoId, videoVersion } = req.body;
    const { postId } = req.params;

    const UpdatePost: IPostDocument = {
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      imgVersion,
      imgId,
      profilePicture,
      videoId,
      videoVersion
    } as IPostDocument;

    const postUpdatedInCache: IPostDocument = await postCache.updatePostInCache(postId, UpdatePost);

    // this can be either before saving to cache or after.
    SocketIOPostObject.emit('updated post', postUpdatedInCache, 'post');
    postQueue.AddPostJob(EDIT_USER_POST_TO_JOB, { key: postId, value: UpdatePost });
    res.status(HTTP_STATUS.CREATED).json({ message: 'Post Updated Successfully' });
  }

  // Handles updating a  user post that contains an image

  /*



  `
    Now three scenarios here:
      The user wants to update a post with an image but:
        1) wants to update the post test but doesn't want to change an image
        2) user might need only to update the post privacy
        3) user might need only to update the post image. I.e replace the image

  */
  @joiValidation(postWithImageSchema)
  public async UpdatePostWithImage(req: Request, res: Response): Promise<void> {
    const { imgId, imgVersion } = req.body;

    // if the imgid and imgversion is in the body then it means the user is only updating the user post data
    if (imgId && imgVersion) {
      UpdatePost.prototype.UpdatePostUtility(req);
    } else {
      const result: UploadApiResponse = await UpdatePost.prototype.addFileToExistingPost(req);

      if (!result.public_id) {
        throw new BadRequestError(result.message);
      }
    }

    res.status(HTTP_STATUS.CREATED).json({ message: 'posts with image updated successfull ' });
  }

  // update post with video
  @joiValidation(postWithVideoSchema)
  public async updatePostWithVideo(req: Request, res: Response): Promise<void> {
    const { videoId, videoVersion } = req.body;
    if (videoId && videoVersion) {
      UpdatePost.prototype.UpdatePostUtility(req);
    } else {
      const result: UploadApiResponse = await UpdatePost.prototype.addFileToExistingPost(req);
      if (!result.public_id) {
        throw new BadRequestError(result.message);
      }
    }
    res.status(HTTP_STATUS.OK).json({ message: 'Post with video updated successfully' });
  }

  // updare post

  public async UpdatePostUtility(req: Request): Promise<void> {
    const { post, bgColor, feelings, privacy, gifUrl, imgVersion, imgId, profilePicture, videoId, videoVersion } = req.body;
    const { postId } = req.params;

    const UpdatePost: IPostDocument = {
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      imgVersion: imgVersion ? imgVersion : '',
      imgId: imgId ? imgId : '',
      profilePicture,
      videoId: videoId ? videoId : '',
      videoVersion: videoVersion ? videoVersion : ''
    } as IPostDocument;

    const postUpdatedInCache: IPostDocument = await postCache.updatePostInCache(postId, UpdatePost);

    // this can be either before saving to cache or after.
    SocketIOPostObject.emit('updated post', postUpdatedInCache, 'post');
    postQueue.AddPostJob(EDIT_USER_POST_TO_JOB, { key: postId, value: UpdatePost });
    return;
  }

  // Add image to existing post
  // if after creating a post and the user want to add a new image, this logic will take care of that
  public async addFileToExistingPost(req: Request): Promise<UploadApiResponse> {
    const { post, bgColor, feelings, privacy, gifUrl, profilePicture, image, video } = req.body;
    const { postId } = req.params;

    /* Here unlike the signup we don't pass three params on the uploads since here we allow cloudinary to generate
       1) the image IDs
      2) the version
      for us.

      */
    const result: UploadApiResponse = image
      ? ((await uploads(image)) as UploadApiResponse)
      : ((await videoUpload(video)) as UploadApiResponse);

    if (!result?.public_id) {
      throw new BadRequestError(result.message);
    }

    const UpdatePost: IPostDocument = {
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      profilePicture,
      imgVersion: image ? result.version.toString() : '',
      imgId: image ? result.public_id : '',
      videoVersion: image ? result.version.toString() : '',
      videoId: image ? result.public_id : ''
    } as IPostDocument;

    const postUpdatedInCache: IPostDocument = await postCache.updatePostInCache(postId, UpdatePost);

    // this can be either before saving to cache or after.
    SocketIOPostObject.emit('updated post', postUpdatedInCache, 'post');
    postQueue.AddPostJob(EDIT_USER_POST_TO_JOB, { key: postId, value: UpdatePost });

    if (image) {
      // call image queue to add image to mongodb database
      imageQueue.addImageJob(ADD_IMAGE_TO_DB_JOB, {
        key: `${req.currentUser!.userId}`,
        imgId: result.public_id,
        imgVersion: result.version.toString()
      });
    }

    return result;
  }
}
