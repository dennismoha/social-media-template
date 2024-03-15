import { REMOVE_FOLLOWER_FROM_DB_JOB } from '@src/constants';
import { followerQueue } from '@src/shared/services/queues/follower.queue';
import { FollowersCache } from '@src/shared/services/redis/follower.cache';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';


const followerCache: FollowersCache = new FollowersCache();

// unfollows a following user

export class Remove {
  public async follower(req: Request, res: Response): Promise<void> {
    const { followeeId, followerId } = req.params;


    /*
      it removes followers from the cache table
    */
    const removeFollowerFromCache: Promise<void> = followerCache.removeFollowerFromCache(`following:${req.currentUser!.userId}`, followeeId);
    const removeFolloweeFromCache: Promise<void> = followerCache.removeFollowerFromCache(`followers:${followeeId}`, followerId);

    /*
      in the user cache, it decrements the number of followers for the followee and the follower
      !.e. when you unfollow, if you had followed 10 people it's reduced to 9
        The person you had followed, he's number of followers is also reduced by -1
    */
    const followersCount: Promise<void> = followerCache.updateFollowersCountInCache(`${followeeId}`, 'followersCount', -1);
    const followeeCount: Promise<void> = followerCache.updateFollowersCountInCache(`${followerId}`, 'followingCount', -1);
    await Promise.all([removeFollowerFromCache, removeFolloweeFromCache, followersCount, followeeCount]);

    followerQueue.addFollowerJob(REMOVE_FOLLOWER_FROM_DB_JOB, {
      keyOne: `${followeeId}`,
      keyTwo: `${followerId}`,
    });
    res.status(HTTP_STATUS.OK).json({ message: 'Unfollowed user now' });
  }
}
