import { DoneCallback, Job } from 'bull';
import Logger from 'bunyan';
import { config } from '@src/config';
import { authservice } from '@src/shared/services/db/auth.service';


const log: Logger = config.createLogger('workers');

class AuthWorker{
  async addAuthUserToDB(job: Job, done: DoneCallback): Promise<void>{
    try {
      const {value} = job.data;

      // add user to the database
      await authservice.createAuthUser(value);
      job.progress(100);
      done(null, job.data);
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }
}

export const authWorker:AuthWorker = new AuthWorker();
