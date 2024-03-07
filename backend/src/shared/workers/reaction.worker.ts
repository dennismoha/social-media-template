import { DoneCallback, Job } from 'bull';
import Logger from 'bunyan';
import { config } from '@src/config';

import { reactionService } from '@src/shared/services/db/reaction.service';



const log: Logger = config.createLogger('reactionworkers');

class ReactionWorker{
  async addReactionToDB(job: Job, done: DoneCallback): Promise<void>{
    try {
      const {data} = job;
      log.warn('add user reaction data to db worker ==> ', job);
      // add user to the database
      await reactionService.addReactionDataToDB(data);
      job.progress(100);
      done(null, data);
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }
  async removeReactionToDB(job: Job, done: DoneCallback): Promise<void>{
    try {
      const {data} = job;
      log.warn('add user reaction data to db worker ==> ', job);
      // add user to the database
      await reactionService.removeReactionDataFromDB(data);
      job.progress(100);
      done(null, data);
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }
}

export const reactionWorker:ReactionWorker = new ReactionWorker();
