import { CurrentUser } from '@src/features/auth/controller/current-user';
import { authMiddleware  } from '@src/shared/globals/helpers/auth-middlewares';
import express, { Router } from 'express';


class CurrentUserRoutes {
  private router: Router;

  constructor(){
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.get('/currentuser', authMiddleware.checkAuthentication, CurrentUser.prototype.read);

    return  this.router;
  }

}

export const currentUserRoutes: CurrentUserRoutes = new CurrentUserRoutes();
