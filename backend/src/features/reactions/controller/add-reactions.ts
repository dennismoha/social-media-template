import { ObjectId } from 'mongodb';
import HTTP_STATUS from 'http-status-codes';
import { IPostDocument } from '@src/features/post/interfaces/post.interface';
import { postSchema, postWithImageSchema } from '@src/features/post/schemes/post.schemes';
import { joiValidation } from '@src/shared/globals/decorators/joi-validation-decorators';
import { Request, Response } from 'express';
import { PostCache } from '@src/shared/services/redis/post.cache';
import { SocketIOPostObject } from '@src/shared/sockets/posts';
import { postQueue } from '@src/shared/services/queues/post.queue';
import { ADD_USER_POST_TO_JOB } from '@src/constants';
import { UploadApiResponse } from 'cloudinary';
import { uploads } from '@src/shared/globals/helpers/cloudinary-upload';
import { BadRequestError } from '@src/shared/globals/helpers/error-handler';
import { addReactionSchema } from '@src/features/reactions/schemes/reactions';
import { IReactionDocument } from '@src/features/reactions/interfaces/reaction.interface';
import { ReactionCache } from '@src/shared/services/redis/reaction-cache';


const reactionCache: ReactionCache = new ReactionCache();

export class Reactions {
  // handles user post without an image
  @joiValidation(addReactionSchema)
  public async addReaction(req: Request, res: Response): Promise<void> {
    const { userTo, postId, type, previousReaction, postReactions, profilePicture } = req.body;

    const reactionObject: IReactionDocument = {
      _id: new ObjectId(),
      username: req.currentUser!.username,
      avataColor: req.currentUser!.avatarColor,
      type,
      postId,
      profilePicture,
    } as IReactionDocument;

    await reactionCache.savePostReactionToCache(postId, reactionObject, postReactions, type, previousReaction);


    res.status(HTTP_STATUS.CREATED).json({message: 'reaction succesfully added'});
  }


}
