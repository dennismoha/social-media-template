import { DoneCallback, Job } from 'bull';
import Logger from 'bunyan';
import { config } from '@src/config';
import { userService } from '@src/shared/services/db/user.service';


const log: Logger = config.createLogger('user workers');

class UserWorker{
  async addUserToDB(job: Job, done: DoneCallback): Promise<void>{
    try {
      const {value} = job.data;

      // add user to the database
      await userService.addUserData(value);
      job.progress(100);
      done(null, job.data);
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }
}

export const userWorker:UserWorker = new UserWorker();