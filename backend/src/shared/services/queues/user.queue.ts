import {  ADD_USER_TO_JOB, UPDATE_BASIC_USER_INFO_TO_JOB, UPDATE_USER_NOTIFICATION_SETTINGS, UPDATE_USER_SOCIAL_INFO_TO_JOB } from '@src/constants';
import { IUserJob } from '@src/features/user/interfaces/user.interface';
import { BaseQueue } from '@src/shared/services/queues/base.queue';
import { userWorker } from '@src/shared/workers/user.worker';

class UserQueue extends BaseQueue {
  constructor(){
    super('user');
    this.processJob(ADD_USER_TO_JOB, 5, userWorker.addUserToDB);
    this.processJob(UPDATE_BASIC_USER_INFO_TO_JOB, 5, userWorker.addUserInfo);
    this.processJob(UPDATE_USER_SOCIAL_INFO_TO_JOB, 5, userWorker.addUserInfo);
    this.processJob(UPDATE_USER_NOTIFICATION_SETTINGS, 5, userWorker.updateNotificationSettings);
  }


  public AddUserJob(name: string, data: IUserJob): void {
    this.addJob(name, data);
  }


}

export const userQueue: UserQueue = new UserQueue();
