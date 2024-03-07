
import { Reactions } from '@src/features/reactions/controller/add-reactions';
import { Remove } from '@src/features/reactions/controller/remove-reaction';
import { authMiddleware  } from '@src/shared/globals/helpers/auth-middlewares';
import express, { Router } from 'express';



class ReactionRoutes {
  private router: Router;

  constructor(){
    this.router = express.Router();
  }

  public routes(): Router {
   ;
    this.router.post('/posts/reaction', authMiddleware.checkAuthentication,Reactions.prototype.addReaction);
    this.router.delete('/posts/reaction/:postId/:previousReaction/:postReactions', authMiddleware.checkAuthentication,Remove.prototype.reaction);



    return  this.router;
  }

}

export const reactionRoutes: ReactionRoutes = new ReactionRoutes();
