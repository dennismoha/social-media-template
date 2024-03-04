import { ADD_USER_POST_TO_JOB, DELETE_USER_POST_TO_JOB } from '@src/constants';
import { IPostJobData } from '@src/features/post/interfaces/post.interface';
import { BaseQueue } from '@src/shared/services/queues/base.queue';
import { postWorker } from '@src/shared/workers/post.worker';



class PostQueue extends BaseQueue {
  constructor(){
    super('post');
    this.processJob( ADD_USER_POST_TO_JOB, 5, postWorker.saveUserPostToDB);
    this.processJob( DELETE_USER_POST_TO_JOB, 5, postWorker.deleteUserPostFromDB);
  }

  public AddPostJob(name: string, data: IPostJobData): void {
    this.addJob(name, data);
  }

}

export const postQueue: PostQueue = new PostQueue();
