import { Password } from '@src/features/auth/controller/password';
import { SignIn } from '@src/features/auth/controller/signin';
import { SignOut } from '@src/features/auth/controller/signout';
import { Signup } from '@src/features/auth/controller/signup';
import express, { Router } from 'express';


class AuthRoutes {
  private router: Router;

  constructor(){
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.post('/signup', Signup.prototype.create);
    this.router.post('/login', SignIn.prototype.read);
    this.router.post('/forgot-password', Password.prototype.create);
    this.router.post('/reset-password/:token', Password.prototype.update);
    return  this.router;
  }

  public signoutRoute(): Router {
    this.router.get('/logout', SignOut.prototype.update);

    return  this.router;
  }
}

export const authRoutes: AuthRoutes = new AuthRoutes();
