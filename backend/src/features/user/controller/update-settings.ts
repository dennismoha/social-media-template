import { UPDATE_USER_NOTIFICATION_SETTINGS } from '@src/constants';
import { notificationSettingsSchema } from '@src/features/user/schemes/info';
import { joiValidation } from '@src/shared/globals/decorators/joi-validation-decorators';
import { userQueue } from '@src/shared/services/queues/user.queue';
import { UserCache } from '@src/shared/services/redis/user.cache';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';


const userCache: UserCache = new UserCache();

export class UpdateSettings {
  @joiValidation(notificationSettingsSchema)
  public async notification(req: Request, res: Response): Promise<void> {
    await userCache.updateSingleUserItemInCache(`${req.currentUser!.userId}`, 'notifications', req.body);
    userQueue.AddUserJob(UPDATE_USER_NOTIFICATION_SETTINGS, {
      key: `${req.currentUser!.userId}`,
      value: req.body
    });
    res.status(HTTP_STATUS.OK).json({ message: 'Notification settings updated successfully', settings: req.body });
  }
}
