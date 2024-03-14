import { ADD_COMMENT_TO_DB_JOB } from '@src/constants';
import { ICommentJob } from '@src/features/comments/interfaces/comment.interface';
import { BaseQueue } from '@src/shared/services/queues/base.queue';
import { commentWorker } from '@src/shared/workers/comment.worker';


class CommentQueue extends BaseQueue {
  constructor() {
    super('comments');
    this.processJob( ADD_COMMENT_TO_DB_JOB, 5, commentWorker.addCommentToDB);
  }

  public addCommentJob(name: string, data: ICommentJob): void {
    this.addJob(name, data);
  }
}

export const commentQueue: CommentQueue = new CommentQueue();
