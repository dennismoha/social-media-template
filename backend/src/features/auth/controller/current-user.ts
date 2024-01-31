import HTTP_STATUS from 'http-status-codes';
import { IUserDocument } from '@src/features/user/interfaces/user.interface';
import { userService } from '@src/shared/services/db/user.service';
import { UserCache } from '@src/shared/services/redis/user.cache';
import { Request, Response } from 'express';

const userCache: UserCache = new UserCache();

export class CurrentUser {
  public async read(req: Request, res: Response): Promise<void> {
    let isUser = false;
    let token = null;
    let user = null;

    // first check if user exists in the cache
    const cachedUser: IUserDocument = (await userCache.getUserFromCache(`${req.currentUser?.userId}`)) as IUserDocument;

    // if user doesn't exist or for some reason redis is down, fetch him from the databasel
    const existingUser: IUserDocument = cachedUser ? cachedUser : await userService.getUserById(`${req.currentUser?.userId}`);
    console.log('exisitng current user is ', existingUser);
     /* The if statement checks if the length of keys is greater than zero, meaning the existingUser object is not empty.If the condition is true,
    it sets isUser to true, assigns the JWT from the session to token (if req.session is defined),
    and assigns the entire existingUser object to the user variable. */
    if (Object.keys(existingUser).length) {
      isUser = true;
      token = req.session?.jwt;
      user = existingUser;
    }

    res.status(HTTP_STATUS.OK).json({ token, isUser, user });
  }
}
