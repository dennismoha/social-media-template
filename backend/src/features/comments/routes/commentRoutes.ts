import { Add } from '@src/features/comments/controller/add-comment';
import { Get } from '@src/features/comments/controller/get-comments';
import { authMiddleware } from '@src/shared/globals/helpers/auth-middlewares';
import express, { Router } from 'express';


class CommentRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.get('/post/comments/:postId', authMiddleware.checkAuthentication, Get.prototype.comments);
    this.router.get('/post/commentsnames/:postId', authMiddleware.checkAuthentication, Get.prototype.commentsNamesFromCache);
    this.router.get('/post/single/comment/:postId/:commentId', authMiddleware.checkAuthentication, Get.prototype.singleComment);

    this.router.post('/post/comment', authMiddleware.checkAuthentication, Add.prototype.comment);

    return this.router;
  }
}

export const commentRoutes: CommentRoutes = new CommentRoutes();
