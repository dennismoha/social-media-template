import { ADD_AUTH_USER_TO_JOB } from '@src/constants';
import { IAuthJob } from '@src/interfaces/auth.interface';
import { BaseQueue } from '@src/shared/services/queues/base.queue';
import { authWorker } from '@src/shared/workers/auth.worker';

class AuthQueue extends BaseQueue {
  constructor(){
    super('auth');
    this.processJob(ADD_AUTH_USER_TO_JOB, 5, authWorker.addAuthUserToDB);
  }

  public AddAuthUserJob(name: string, data: IAuthJob): void {
    this.addJob(name, data);
  }


}

export const authQueue: AuthQueue = new AuthQueue();
