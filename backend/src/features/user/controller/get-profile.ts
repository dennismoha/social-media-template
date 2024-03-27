import { IFollowerData } from '@src/features/follower/interfaces/follower.interface';
import { IPostDocument } from '@src/features/post/interfaces/post.interface';
import { IAllUsers, IUserDocument } from '@src/features/user/interfaces/user.interface';
import { Helpers } from '@src/shared/globals/helpers/helpers';
import { followerService } from '@src/shared/services/db/follower.service';
import { postService } from '@src/shared/services/db/post.service';
import { userService } from '@src/shared/services/db/user.service';
import { FollowersCache } from '@src/shared/services/redis/follower.cache';
import { PostCache } from '@src/shared/services/redis/post.cache';
import { UserCache } from '@src/shared/services/redis/user.cache';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

import mongoose from 'mongoose';

const PAGE_SIZE = 12;

interface IUserAll {
  newSkip: number;
  limit: number;
  skip: number;
  userId: string;
}

const postCache: PostCache = new PostCache();
const userCache: UserCache = new UserCache();
const followerCache: FollowersCache = new FollowersCache();

export class Get {
  // this fetches all users
  public async all(req: Request, res: Response): Promise<void> {
    // fetches users with respect to pagination
    const { page } = req.params; // page number
    const skip: number = (parseInt(page) - 1) * PAGE_SIZE; // the number of object to skip
    const limit: number = PAGE_SIZE * parseInt(page); // limit the number of returned objects
    const newSkip: number = skip === 0 ? skip : skip + 1;

    // fetch all users
    const allUsers = await Get.prototype.allUsers({
      newSkip,
      limit,
      skip,
      userId: `${req.currentUser!.userId}`
    });

    // for each user we return the number of followers
    const followers: IFollowerData[] = await Get.prototype.followers(`${req.currentUser!.userId}`);
    res.status(HTTP_STATUS.OK).json({ message: 'Get users', users: allUsers.users, totalUsers: allUsers.totalUsers, followers });
  }

  // get profile data of the logged in user
  public async profile(req: Request, res: Response): Promise<void> {
    // first of all fetch user from cache
    const cachedUser: IUserDocument = (await userCache.getUserFromCache(`${req.currentUser!.userId}`)) as IUserDocument;
    // if cached user is not null, fetch user details from the db
    const existingUser: IUserDocument = cachedUser ? cachedUser : await userService.getUserById(`${req.currentUser!.userId}`);
    res.status(HTTP_STATUS.OK).json({ message: 'Get user profile', user: existingUser });
  }

  // once you click on a user, fetch  his profile data
  public async profileByUserId(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const cachedUser: IUserDocument = (await userCache.getUserFromCache(userId)) as IUserDocument;
    const existingUser: IUserDocument = cachedUser ? cachedUser : await userService.getUserById(userId);
    res.status(HTTP_STATUS.OK).json({ message: 'Get user profile by id', user: existingUser });
  }

  // get the user profile and the posts
  public async profileAndPosts(req: Request, res: Response): Promise<void> {
    const { userId, username, uId } = req.params;
    const userName: string = Helpers.firstLetterToUpperCase(username);
    // fetch the user data
    const cachedUser: IUserDocument = (await userCache.getUserFromCache(userId)) as IUserDocument;
    // fetch the posts
    const cachedUserPosts: IPostDocument[] = await postCache.getUserPostsFromCache('post', parseInt(uId, 10));

    // if none in the cache, fetch from db
    const existingUser: IUserDocument = cachedUser ? cachedUser : await userService.getUserById(userId);
    const userPosts: IPostDocument[] = cachedUserPosts.length
      ? cachedUserPosts
      : await postService.getPosts({ username: userName }, 0, 100, { createdAt: -1 });

    res.status(HTTP_STATUS.OK).json({ message: 'Get user profile and posts', user: existingUser, posts: userPosts });
  }

  // get random users
  public async randomUserSuggestions(req: Request, res: Response): Promise<void> {
    let randomUsers: IUserDocument[] = [];
    const cachedUsers: IUserDocument[] = await userCache.getRandomUsersFromCache(`${req.currentUser!.userId}`, req.currentUser!.username);
    if(cachedUsers.length) {
      randomUsers = [...cachedUsers];
    } else {
      const users: IUserDocument[] = await userService.getRandomUsers(req.currentUser!.userId);
      randomUsers = [...users];
    }
    res.status(HTTP_STATUS.OK).json({ message: 'User suggestions', users: randomUsers });
  }

  // utility function to fetch users from mongo / redis
  private async allUsers({ newSkip, limit, skip, userId }: IUserAll): Promise<IAllUsers> {
    let users;
    let type = '';
    const cachedUsers: IUserDocument[] = (await userCache.getUsersFromCache(newSkip, limit, userId)) as IUserDocument[];
    if (cachedUsers.length) {
      type = 'redis';
      users = cachedUsers;
    } else {
      type = 'mongodb';
      users = await userService.getAllUsers(userId, skip, limit);
    }
    const totalUsers: number = await Get.prototype.usersCount(type);
    return { users, totalUsers };
  }

  // returns the total number of users either from cache or mongodb
  private async usersCount(type: string): Promise<number> {
    const totalUsers: number = type === 'redis' ? await userCache.getTotalUsersInCache() : await userService.getTotalUsersInDB();
    return totalUsers;
  }

  // fetch followers
  private async followers(userId: string): Promise<IFollowerData[]> {
    const cachedFollowers: IFollowerData[] = await followerCache.getFollowersFromCache(`followers:${userId}`);
    // we fetch the details of the followers following the logged in user
    const result = cachedFollowers.length ? cachedFollowers : await followerService.getFollowerData(new mongoose.Types.ObjectId(userId));
    return result;
  }
}
