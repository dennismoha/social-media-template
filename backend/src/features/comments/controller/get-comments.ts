import { ICommentDocument, ICommentNameList } from '@src/features/comments/interfaces/comment.interface';
import { commentService } from '@src/shared/services/db/comment.service';
import { CommentsCache } from '@src/shared/services/redis/comments.cache';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

import mongoose from 'mongoose';

const commentCache: CommentsCache = new CommentsCache();

export class Get {
  public async comments(req: Request, res: Response): Promise<void> {
    const { postId } = req.params;

    //fetch comments from the cache first
    const cachedComments: ICommentDocument[] = await commentCache.getCommentsFromCache(postId);

    // if comments.length > 0 return cachedComments else fetch comments from the db
    // createdAt -1 means you fetch them in descending order
    const comments: ICommentDocument[] = cachedComments.length
      ? cachedComments
      : await commentService.getPostComments({ postId: new mongoose.Types.ObjectId(postId) }, { createdAt: -1 });

    res.status(HTTP_STATUS.OK).json({ message: 'Post comments', comments });
  }

  // fetch comment names from cache

  public async commentsNamesFromCache(req: Request, res: Response): Promise<void> {
    const { postId } = req.params;
    const cachedCommentsNames: ICommentNameList[] = await commentCache.getCommentsNamesFromCache(postId);
    const commentsNames: ICommentNameList[] = cachedCommentsNames.length
      ? cachedCommentsNames
      : await commentService.getPostCommentNames({ postId: new mongoose.Types.ObjectId(postId) }, { createdAt: -1 });

    res.status(HTTP_STATUS.OK).json({ message: 'Post comments names', comments: commentsNames });
  }

  public async singleComment(req: Request, res: Response): Promise<void> {
    const { postId, commentId } = req.params;
    const cachedComments: ICommentDocument[] = await commentCache.getSingleCommentFromCache(postId, commentId);
    const comments: ICommentDocument[] = cachedComments.length
      ? cachedComments
      : await commentService.getPostComments({ _id: new mongoose.Types.ObjectId(commentId) }, { createdAt: -1 });

    res.status(HTTP_STATUS.OK).json({ message: 'Single comment', comments: comments[0] });
  }
}
