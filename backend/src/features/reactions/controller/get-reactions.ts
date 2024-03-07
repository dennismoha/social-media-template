import HTTP_STATUS from 'http-status-codes';

import { Request, Response } from 'express';

import { IReactionDocument } from '@src/features/reactions/interfaces/reaction.interface';
import { ReactionCache } from '@src/shared/services/redis/reaction-cache';

import { reactionService } from '@src/shared/services/db/reaction.service';
import mongoose from 'mongoose';

const reactionCache: ReactionCache = new ReactionCache();

export class GetReactions {
  public async Get(req: Request, res: Response): Promise<void> {
    const { postId } = req.params;

    // check first if the data exists in the cache
    // if not go to the db

    // fetch cached data first
    const cachedReactions: [IReactionDocument[], number] = await reactionCache.getReactionsFromCache(postId);

    // if the cached Reactions 0 length is equal to zero then fetch from the db
    const reactions: [IReactionDocument[], number] = cachedReactions[0].length
      ? cachedReactions
      : await reactionService.getPostReactions({ postId: new mongoose.Types.ObjectId(postId) }, { createdAt: -1 });
    res.status(HTTP_STATUS.OK).json({ message: 'Post reactions', reactions: reactions[0], count: reactions[1] });
  }

  // get single reaction by username
  public async singleReactionByUsername(req: Request, res: Response): Promise<void> {
    const { postId, username } = req.params;

    // check first if the data exists in the cache
    // if not go to the db

    // fetch cached data first
    const cachedReactions: [IReactionDocument, number] | [] = await reactionCache.getSingleReactionByUsernameFromCache(postId, username);

    // if the cached Reactions 0 length is equal to zero then fetch from the db
    const reactions: [IReactionDocument, number] | [] = cachedReactions.length
      ? cachedReactions
      : await reactionService.getSinglePostReactionByUsername(postId, username);
    res.status(HTTP_STATUS.OK).json({
      message: 'single Post reaction by username',
      reactions: reactions.length ? reactions[0] : {},
      count: reactions.length ? reactions[1] : 0
    });
  }

  // get all reactions for a particular user using his username
  public async getReactionsByUsername(req: Request, res: Response): Promise<void> {
    const { username } = req.params;

    // here we fetch them from the db directyly

    const reactions: IReactionDocument[] = await reactionService.getReactionsByUsername(username);
    res.status(HTTP_STATUS.OK).json({ message: 'All user reactions by username', reactions });
  }
}
