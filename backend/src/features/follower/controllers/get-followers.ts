import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import HTTP_STATUS from 'http-status-codes';
import mongoose from 'mongoose';
import { FollowersCache } from '@src/shared/services/redis/follower.cache';
import { IFollowerData } from '@src/features/follower/interfaces/follower.interface';
import { followerService } from '@src/shared/services/db/follower.service';

const followerCache: FollowersCache = new FollowersCache();

export class Get {
  // currently logged in user will get all users they are following
  public async userFollowing(req: Request, res: Response): Promise<void> {
    const userObjectId: ObjectId = new mongoose.Types.ObjectId(req.currentUser!.userId);
    // get followers from cache first
    const cachedFollowees: IFollowerData[] = await followerCache.getFollowersFromCache(`following:${req.currentUser!.userId}`);
    // if no cached followers then look for the followers from the db
    const following: IFollowerData[] = cachedFollowees.length ? cachedFollowees : await followerService.getFolloweeData(userObjectId);
    res.status(HTTP_STATUS.OK).json({ message: 'User following', following });
  }

  public async userFollowers(req: Request, res: Response): Promise<void> {
    const userObjectId: ObjectId = new mongoose.Types.ObjectId(req.params.userId);
    const cachedFollowers: IFollowerData[] = await followerCache.getFollowersFromCache(`followers:${req.params.userId}`);
    const followers: IFollowerData[] = cachedFollowers.length ? cachedFollowers : await followerService.getFollowerData(userObjectId);
    res.status(HTTP_STATUS.OK).json({ message: 'User followers', followers });
  }
}
