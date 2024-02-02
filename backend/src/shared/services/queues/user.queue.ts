import {  ADD_USER_TO_JOB } from '@src/constants';
import { BaseQueue } from '@src/shared/services/queues/base.queue';
import { userWorker } from '@src/shared/workers/user.worker';

class UserQueue extends BaseQueue {
  constructor(){
    super('user');
    this.processJob(ADD_USER_TO_JOB, 5, userWorker.addUserToDB);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public AddUserJob(name: string, data: any): void {
    this.addJob(name, data);
  }


}

export const userQueue: UserQueue = new UserQueue();
