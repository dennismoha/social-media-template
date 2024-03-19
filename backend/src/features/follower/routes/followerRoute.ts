import { AddUser } from '@src/features/follower/controllers/block-user';
import { Add } from '@src/features/follower/controllers/follower-user';
import { Get } from '@src/features/follower/controllers/get-followers';
import { Remove } from '@src/features/follower/controllers/unfollow-user';
import { authMiddleware } from '@src/shared/globals/helpers/auth-middlewares';
import express, { Router } from 'express';


class FollowerRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.get('/user/following', authMiddleware.checkAuthentication, Get.prototype.userFollowing);
    this.router.get('/user/followers/:userId', authMiddleware.checkAuthentication, Get.prototype.userFollowers);

    this.router.put('/user/follow/:followerId', authMiddleware.checkAuthentication, Add.prototype.follower);
    this.router.put('/user/unfollow/:followeeId/:followerId', authMiddleware.checkAuthentication, Remove.prototype.follower);
    this.router.put('/user/block/:followerId', authMiddleware.checkAuthentication, AddUser.prototype.block);
    this.router.put('/user/unblock/:followerId', authMiddleware.checkAuthentication, AddUser.prototype.unblock);

    return this.router;
  }
}

export const followerRoutes: FollowerRoutes = new FollowerRoutes();
