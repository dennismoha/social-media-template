import {  ADD_REACTION_TO_DB_JOB, REMOVE_REACTION_FROM_DB_JOB } from '@src/constants';
import { IReactionJob } from '@src/features/reactions/interfaces/reaction.interface';
import { BaseQueue } from '@src/shared/services/queues/base.queue';
import { reactionWorker } from '@src/shared/workers/reaction.worker';


class ReactionQueue extends BaseQueue {
  constructor(){
    super('reactions');
    this.processJob(ADD_REACTION_TO_DB_JOB, 5, reactionWorker.addReactionToDB);
    this.processJob(REMOVE_REACTION_FROM_DB_JOB, 5, reactionWorker.removeReactionToDB);
  }


  public AddReactionJob(name: string, data: IReactionJob): void {
    this.addJob(name, data);
  }


}

export const reactionQueue: ReactionQueue = new ReactionQueue();
