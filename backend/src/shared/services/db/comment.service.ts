/* eslint-disable @typescript-eslint/no-unused-vars */

import { ICommentDocument, ICommentJob, ICommentNameList, IQueryComment } from '@src/features/comments/interfaces/comment.interface';
import { CommentsModel } from '@src/features/comments/models/comment.schema';
import { IPostDocument } from '@src/features/post/interfaces/post.interface';
import { PostModel } from '@src/features/post/models/post.schema';
import { IUserDocument } from '@src/features/user/interfaces/user.interface';
import { UserCache } from '@src/shared/services/redis/user.cache';
import { Query } from 'mongoose';

const userCache: UserCache = new UserCache();

class CommentService {
  // add comment to the database
  public async addCommentToDB(commentData: ICommentJob): Promise<void> {
    const { postId, userTo, userFrom, comment, username } = commentData;

    // query to create a new comment on the db
    const comments: Promise<ICommentDocument> = CommentsModel.create(comment);

    // query to update the number of comments in the respect post
    const post: Query<IPostDocument, IPostDocument> = PostModel.findOneAndUpdate(
      { _id: postId },
      { $inc: { commentsCount: 1 } },
      { new: true }
    ) as Query<IPostDocument, IPostDocument>;
    const user: Promise<IUserDocument> = userCache.getUserFromCache(userTo) as Promise<IUserDocument>;

    // execute all the queries at once
    // the order of the params with respect to the order of the return values matters
    const response: [ICommentDocument, IPostDocument, IUserDocument] = await Promise.all([comments, post, user]);

    // send comments notification
  }

  // returns multiple comments for a post or a single comment for a post
  public async getPostComments(query: IQueryComment, sort: Record<string, 1 | -1>): Promise<ICommentDocument[]> {
    const comments: ICommentDocument[] = await CommentsModel.aggregate([
      { $match: query },
      { $sort: sort }
    ]);
    return comments;
  }

  public async getPostCommentNames(query: IQueryComment, sort: Record<string, 1 | -1>): Promise<ICommentNameList[]> {
    const commentsNamesList: ICommentNameList[] = await CommentsModel.aggregate([
      { $match: query },
      { $sort: sort },
      { $group: { _id: null, names: { $addToSet: '$username' }, count: { $sum: 1 } } },
      { $project: { _id: 0 } }
    ]);
    return commentsNamesList;
  }
}

export const commentService: CommentService = new CommentService();
