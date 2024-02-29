import { CreatePost } from '@src/features/post/controller/create-posts';
import { authMiddleware  } from '@src/shared/globals/helpers/auth-middlewares';
import express, { Router } from 'express';



class PostRoutes {
  private router: Router;

  constructor(){
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.post('/post', authMiddleware.checkAuthentication,CreatePost.prototype.post);
    this.router.post('/post/image/post', authMiddleware.checkAuthentication,CreatePost.prototype.postWithImage);

    return  this.router;
  }

}

export const postRoutes: PostRoutes = new PostRoutes();
