import { ISearchUser } from '@src/features/user/interfaces/user.interface';
import { Helpers } from '@src/shared/globals/helpers/helpers';
import { userService } from '@src/shared/services/db/user.service';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

// NB: we would have searched from the cache but that would be alot of work for now in the
// scope of this small project



export class Search {
  public async user(req: Request, res: Response): Promise<void> {
    const regex = new RegExp(Helpers.escapeRegex(req.params.query), 'i');
    const users: ISearchUser[] = await userService.searchUsers(regex);
    res.status(HTTP_STATUS.OK).json({ message: 'Search results', search: users });
  }
}
