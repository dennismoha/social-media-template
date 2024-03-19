import { COMMENT_EMAIL, FORGOT_PASSWORD } from '@src/constants';
import { IEmailJob } from '@src/features/user/interfaces/user.interface';
import { BaseQueue } from '@src/shared/services/queues/base.queue';
import { emailWorker } from '@src/shared/workers/email.worker';


class EmailQueue extends BaseQueue {
  constructor(){
    super('emails');
    this.processJob( FORGOT_PASSWORD, 5, emailWorker.addNotificationEmail);
    this.processJob( COMMENT_EMAIL, 5, emailWorker.addNotificationEmail);
  }

  public AddEmailJob(name: string, data: IEmailJob): void {
    this.addJob(name, data);
  }


}

export const emailQueue: EmailQueue = new EmailQueue();
