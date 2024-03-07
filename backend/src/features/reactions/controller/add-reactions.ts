import { ObjectId } from 'mongodb';
import HTTP_STATUS from 'http-status-codes';

import { joiValidation } from '@src/shared/globals/decorators/joi-validation-decorators';
import { Request, Response } from 'express';

import { addReactionSchema } from '@src/features/reactions/schemes/reactions';
import { IReactionDocument, IReactionJob } from '@src/features/reactions/interfaces/reaction.interface';
import { ReactionCache } from '@src/shared/services/redis/reaction-cache';
import {  ADD_REACTION_TO_DB_JOB } from '@src/constants';
import { reactionQueue } from '@src/shared/services/queues/reaction.queue';


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

    // add reactions to cache
    const databaseReactionData: IReactionJob = {
      postId,
      userTo,
      userFrom: req.currentUser!.userId,
      username: req.currentUser!.username,
      type,
      previousReaction,
      reactionObject
    };

    reactionQueue.AddReactionJob(ADD_REACTION_TO_DB_JOB, databaseReactionData);
    res.status(HTTP_STATUS.OK).json({ message: 'Reaction added successfully' });


    res.status(HTTP_STATUS.CREATED).json({message: 'reaction succesfully added'});
  }


}
