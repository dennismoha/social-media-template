import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

import { UPDATE_BASIC_USER_INFO_TO_JOB, UPDATE_USER_SOCIAL_INFO_TO_JOB } from '@src/constants';
import { UserCache } from '@src/shared/services/redis/user.cache';
import { basicInfoSchema, socialLinksSchema } from '@src/features/user/schemes/info';
import { joiValidation } from '@src/shared/globals/decorators/joi-validation-decorators';
import { userQueue } from '@src/shared/services/queues/user.queue';

const userCache: UserCache = new UserCache();

export class Edit {
  @joiValidation(basicInfoSchema)
  public async info(req: Request, res: Response): Promise<void> {
    for (const [key, value] of Object.entries(req.body)) {
      await userCache.updateSingleUserItemInCache(`${req.currentUser!.userId}`, key, `${value}`);
    }
    userQueue.AddUserJob(UPDATE_BASIC_USER_INFO_TO_JOB, {
      key: `${req.currentUser!.userId}`,
      value: req.body
    });
    res.status(HTTP_STATUS.OK).json({ message: 'Updated successfully' });
  }

  @joiValidation(socialLinksSchema)
  public async social(req: Request, res: Response): Promise<void> {
    await userCache.updateSingleUserItemInCache(`${req.currentUser!.userId}`, 'social', req.body);
    userQueue.AddUserJob(UPDATE_USER_SOCIAL_INFO_TO_JOB, {
      key: `${req.currentUser!.userId}`,
      value: req.body
    });
    res.status(HTTP_STATUS.OK).json({ message: 'Updated successfully' });
  }
}
