import { ADD_BLOCKED_USER_TO_DB, REMOVE_BLOCKED_USER_FROM_DB } from '@src/constants';
import { IBlockedUserJobData } from '@src/features/follower/interfaces/follower.interface';
import { BaseQueue } from '@src/shared/services/queues/base.queue';
import { blockedUserWorker } from '@src/shared/workers/blocked.worker';

class BlockedUserQueue extends BaseQueue {
  constructor() {
    super('blockedUsers');
    this.processJob(ADD_BLOCKED_USER_TO_DB, 5, blockedUserWorker.addBlockedUserToDB);
    this.processJob(REMOVE_BLOCKED_USER_FROM_DB, 5, blockedUserWorker.addBlockedUserToDB);
  }

  public addBlockedUserJob(name: string, data: IBlockedUserJobData): void {
    this.addJob(name, data);
  }
}

export const blockedUserQueue: BlockedUserQueue = new BlockedUserQueue();
