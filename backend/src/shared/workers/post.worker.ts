import { DoneCallback, Job } from 'bull';
import Logger from 'bunyan';
import { config } from '@src/config';
import { postService } from '@src/shared/services/db/post.service';





const log: Logger = config.createLogger('postWorker');

class PostWorker{
  async saveUserPostToDB(job: Job, done: DoneCallback): Promise<void>{
    try {
      const {key, value} = job.data;
      log.warn('add  user post to db worker ==> ', job);
      // add user to the database
      await postService.addPostToDB(key, value);
      job.progress(100);
      done(null, job.data);
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }

  // delete post
  async deleteUserPostFromDB(job: Job, done: DoneCallback): Promise<void>{
    try {
      const {keyOne, keyTwo} = job.data;
      log.warn('add  user post to db worker ==> ', job);
      // add user to the database
      await postService.deletePost(keyOne, keyTwo);
      job.progress(100);
      done(null, job.data);
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }

  //  post worker
  async updateUserPostInDB(job: Job, done: DoneCallback): Promise<void>{
    try {
      const {key, value} = job.data;
      log.warn('update  user post to db worker ==> ', job);
      // add user to the database
      await postService.editPost(key, value);
      job.progress(100);
      done(null, job.data);
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }
}

export const postWorker:PostWorker = new PostWorker();
