import { IAuthJob } from '@src/interfaces/auth.interface';
import { BaseQueue } from '@src/shared/services/queues/base.queue';

class AuthQueue extends BaseQueue {
  constructor(){
    super('auth');
  }

  public AddAuthUserJob(name: string, data: IAuthJob): void {
    this.addJob(name, data);
  }


}

export const authQueue: AuthQueue = new AuthQueue();
