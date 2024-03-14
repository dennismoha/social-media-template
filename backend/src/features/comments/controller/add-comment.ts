import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import HTTP_STATUS from 'http-status-codes';
import { CommentsCache } from '@src/shared/services/redis/comments.cache';
import { addCommentSchema } from '@src/features/comments/schemes/comment';
import { joiValidation } from '@src/shared/globals/decorators/joi-validation-decorators';
import { ICommentDocument, ICommentJob } from '@src/features/comments/interfaces/comment.interface';
import { commentQueue } from '@src/shared/services/queues/comment.queue';
import { ADD_COMMENT_TO_DB_JOB } from '@src/constants';




const commentCache: CommentsCache = new CommentsCache();

export class Add {
  @joiValidation(addCommentSchema)
  public async comment(req: Request, res: Response): Promise<void> {
    const { userTo, postId, profilePicture, comment } = req.body;
    const commentObjectId: ObjectId = new ObjectId();

    const commentData: ICommentDocument = {
      _id: commentObjectId,
      postId,
      username: `${req.currentUser?.username}`,
      avatarColor: `${req.currentUser?.avatarColor}`,
      profilePicture,
      comment,
      createdAt: new Date()
    } as ICommentDocument;
    await commentCache.savePostCommentToCache(postId, JSON.stringify(commentData));

    const databaseCommentData: ICommentJob = {
      postId,
      userTo,
      userFrom: req.currentUser!.userId,
      username: req.currentUser!.username,
      comment: commentData
    };
    commentQueue.addCommentJob(ADD_COMMENT_TO_DB_JOB, databaseCommentData);
    res.status(HTTP_STATUS.OK).json({ message: 'Comment created successfully' });
  }
}
