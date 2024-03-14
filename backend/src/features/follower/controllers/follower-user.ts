
import { Request, Response } from 'express';
// import { ObjectId } from 'mongodb';
import HTTP_STATUS from 'http-status-codes';

import mongoose from 'mongoose';
import { UserCache } from '@src/shared/services/redis/user.cache';
import { IUserDocument } from '@src/features/user/interfaces/user.interface';
import { IFollowerData } from '@src/features/follower/interfaces/follower.interface';
import { SocketIOFollowerObject } from '@src/shared/sockets/follower';
// import { followerQueue } from '@src/shared/services/queues/follower.queue';
import { FollowersCache } from '@src/shared/services/redis/follower.cache';


const followerCache: FollowersCache = new FollowersCache();
const userCache: UserCache = new UserCache();

/*
  We first update the followersCount and the following count in the user cache
  Then we fetch that data and send it back to the client using socket.io

*/

export class Add {
  public async follower(req: Request, res: Response): Promise<void> {
    const { followerId } = req.params;
    // followerId is the id of the user that is being followed
    // followeeid is the user that is following and we get that from req.currentUser

    /*
       here we are updating the number of people that are following the follwerdId person.
       so if user1 is following user two, then we are updating the count of the number of people following user2
       That is contained in the followersCount in our redis userCache followingCount field
    */
    const followersCount: Promise<void> = followerCache.updateFollowersCountInCache(`${followerId}`, 'followersCount', 1);

     /*
       here we are updating the number of people that the logged  in user is following.
       so if user1 is following user two, then we are updating the count of the number of people user1 is following
       That is contained in the followingCount in our redis userCache followersCount field
    */

    const followeeCount: Promise<void> = followerCache.updateFollowersCountInCache(`${req.currentUser!.userId}`, 'followingCount', 1);
    await Promise.all([followersCount, followeeCount]);

    /*

      Once we update the properties in the userCache above we fetch and return the updated data in cache.
      This is the data we are going to send back to the client using socket io but first we structure it
      through the Private UserData method

    */

    const cachedFollower: Promise<IUserDocument> = userCache.getUserFromCache(followerId) as Promise<IUserDocument>;
    const cachedFollowee: Promise<IUserDocument> = userCache.getUserFromCache(`${req.currentUser!.userId}`) as Promise<IUserDocument>;
    const response: [IUserDocument, IUserDocument] = await Promise.all([cachedFollower, cachedFollowee]);

    // const followerObjectId: ObjectId = new ObjectId();

    // This is the data we will be sending back to the client using socket.io
    const addFolloweeData: IFollowerData = Add.prototype.userData(response[0]);

    // No we send the data to the client
    SocketIOFollowerObject.emit('add follower', addFolloweeData);

    /*
      Then now save the   id of the user getting followed in cache
      Now assuming user1 is following user2, then on the redis list the structure will be as:
          following:
            key('current logged in user key'): ('id of the user followed')

    */
    const addFollowerToCache: Promise<void> = followerCache.saveFollowerToCache(`following:${req.currentUser!.userId}`, `${followerId}`);

    /*
      Then now save the   id of the user who has been  followed in cache
      Now assuming user2 has been followed by user1, then on the redis list the structure will be as:
          following:
            key('id of the user followed' ): ('current logged in user key')

    */

    const addFolloweeToCache: Promise<void> = followerCache.saveFollowerToCache(`followers:${followerId}`, `${req.currentUser!.userId}`);
    await Promise.all([addFollowerToCache, addFolloweeToCache]);

    // send the data to queue
    // followerQueue.addFollowerJob('addFollowerToDB', {
    //   keyOne: `${req.currentUser!.userId}`,
    //   keyTwo: `${followerId}`,
    //   username: req.currentUser!.username,
    //   followerDocumentId: followerObjectId
    // });
    res.status(HTTP_STATUS.OK).json({ message: 'Following user now' });
  }

  /*

    This is the structure of the data that  we will be sending back to the client using socket.io
    We are not saving it anywhere to redis or the db

  */

  private userData(user: IUserDocument): IFollowerData {
    return {
      _id: new mongoose.Types.ObjectId(user._id),
      username: user.username!,
      avatarColor: user.avatarColor!,
      postCount: user.postsCount,
      followersCount: user.followersCount,
      followingCount: user.followingCount,
      profilePicture: user.profilePicture,
      uId: user.uId!,
      userProfile: user
    };
  }
}
