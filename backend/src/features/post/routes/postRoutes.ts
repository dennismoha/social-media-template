import { CreatePost } from '@src/features/post/controller/create-posts';
import { DeletePost } from '@src/features/post/controller/delete-post';
import { GetPosts } from '@src/features/post/controller/get-posts';
import { UpdatePost } from '@src/features/post/controller/update-posts';
import { authMiddleware  } from '@src/shared/globals/helpers/auth-middlewares';
import express, { Router } from 'express';



class PostRoutes {
  private router: Router;

  constructor(){
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.get('/post/all/:page', authMiddleware.checkAuthentication,GetPosts.prototype.fetchPost);
    this.router.get('/post/images/:page', authMiddleware.checkAuthentication,GetPosts.prototype.fetchPostsWithImages);
    this.router.post('/post', authMiddleware.checkAuthentication,CreatePost.prototype.post);
    this.router.post('/post/image/post', authMiddleware.checkAuthentication,CreatePost.prototype.postWithImage);
    this.router.post('/post/video/post', authMiddleware.checkAuthentication,CreatePost.prototype.postWithVideo);
    this.router.put('/post/:postId', authMiddleware.checkAuthentication,UpdatePost.prototype.post);
    this.router.put('/post/image/:postId', authMiddleware.checkAuthentication,UpdatePost.prototype.UpdatePostWithImage);
    this.router.delete('/post/:postId', authMiddleware.checkAuthentication,DeletePost.prototype.deletePost);


    return  this.router;
  }

}

export const postRoutes: PostRoutes = new PostRoutes();
