import { ADD_FOLLOWER_TO_DB_JOB } from '@src/constants';
import { IFollowerJobData } from '@src/features/follower/interfaces/follower.interface';
import { BaseQueue } from '@src/shared/services/queues/base.queue';
import { userWorker } from '@src/shared/workers/user.worker';

class FollowerQueue extends BaseQueue {
  constructor() {
    super('follower');
    this.processJob(ADD_FOLLOWER_TO_DB_JOB, 5, userWorker.addUserToDB);
  }

  public addFollowerJob(name: string, data: IFollowerJobData): void {
    this.addJob(name, data);
  }
}

export const followerQueue: FollowerQueue = new FollowerQueue();
