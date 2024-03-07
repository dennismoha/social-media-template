
import { Reactions } from '@src/features/reactions/controller/add-reactions';
import { GetReactions } from '@src/features/reactions/controller/get-reactions';
import { Remove } from '@src/features/reactions/controller/remove-reaction';
import { authMiddleware  } from '@src/shared/globals/helpers/auth-middlewares';
import express, { Router } from 'express';



class ReactionRoutes {
  private router: Router;

  constructor(){
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.get('/posts/reactions/:postId', authMiddleware.checkAuthentication,GetReactions.prototype.Get);
    this.router.get(
      '/post/single/reaction/username/:username/:postId',
      authMiddleware.checkAuthentication,
      GetReactions.prototype.singleReactionByUsername
    );
    this.router.get('/post/reactions/username/:username', authMiddleware.checkAuthentication, GetReactions.prototype.getReactionsByUsername);
    this.router.post('/posts/reaction', authMiddleware.checkAuthentication,Reactions.prototype.addReaction);
    this.router.delete('/posts/reaction/:postId/:previousReaction/:postReactions', authMiddleware.checkAuthentication,Remove.prototype.reaction);



    return  this.router;
  }

}

export const reactionRoutes: ReactionRoutes = new ReactionRoutes();
