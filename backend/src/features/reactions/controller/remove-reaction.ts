import { IReactionJob } from '@src/features/reactions/interfaces/reaction.interface';
import { reactionQueue } from '@src/shared/services/queues/reaction.queue';
import { ReactionCache } from '@src/shared/services/redis/reaction-cache';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import {  REMOVE_REACTION_FROM_DB_JOB } from '@src/constants';

const reactionCache: ReactionCache = new ReactionCache();

export class Remove {
  public async reaction(req: Request, res: Response): Promise<void> {
    const { postId, previousReaction, postReactions } = req.params;

    // remove post reaction from cache
    await reactionCache.removePostReactionFromCache(postId, `${req.currentUser!.username}`, JSON.parse(postReactions));
    const databaseReactionData: IReactionJob = {
      postId,
      username: req.currentUser!.username,
      previousReaction
    };

    // queue to remove reaction from db
    reactionQueue.AddReactionJob(REMOVE_REACTION_FROM_DB_JOB, databaseReactionData);
    res.status(HTTP_STATUS.OK).json({ message: 'Reaction removed from post' });
  }
}
