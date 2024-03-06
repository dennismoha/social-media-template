
import { Reactions } from '@src/features/reactions/controller/add-reactions';
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



    return  this.router;
  }

}

export const reactionRoutes: ReactionRoutes = new ReactionRoutes();
