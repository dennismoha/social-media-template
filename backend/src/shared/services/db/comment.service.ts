/* eslint-disable @typescript-eslint/no-unused-vars */

import { COMMENT_EMAIL } from '@src/constants';
import { ICommentDocument, ICommentJob, ICommentNameList, IQueryComment } from '@src/features/comments/interfaces/comment.interface';
import { CommentsModel } from '@src/features/comments/models/comment.schema';
import { INotificationDocument, INotificationTemplate } from '@src/features/notifications/interfaces/notification.interface';
import { NotificationModel } from '@src/features/notifications/models/notification.schema';
import { IPostDocument } from '@src/features/post/interfaces/post.interface';
import { PostModel } from '@src/features/post/models/post.schema';
import { IUserDocument } from '@src/features/user/interfaces/user.interface';
import { notificationTemplate } from '@src/shared/services/emails/templates/notifications/notification-template';
import { emailQueue } from '@src/shared/services/queues/email.queue';
import { UserCache } from '@src/shared/services/redis/user.cache';
import { socketIONotificationObject } from '@src/shared/sockets/notification';
import mongoose, { Query } from 'mongoose';

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
    // if comments notifications are turned on, then they'll be saved and user will be alerted
    if(response[2].notifications.comments && userFrom !== userTo) {
      // instatiation notification model this way gives us all methods defined in the notification schema
      const notificationModel: INotificationDocument = new NotificationModel();
      const notifications = await notificationModel.insertNotification({
        userFrom,
        userTo,
        message: `${username} commented on your post.`,
        notificationType: 'comment',
        entityId: new mongoose.Types.ObjectId(postId),
        createdItemId: new mongoose.Types.ObjectId(response[0]._id!),
        createdAt: new Date(),
        comment: comment.comment,
        post: response[1].post,
        imgId: response[1].imgId!,
        imgVersion: response[1].imgVersion!,
        gifUrl: response[1].gifUrl!,
        reaction: ''
      });
      // send to client with socketio
      socketIONotificationObject.emit('insert notification', notifications,{userTo});

      // send to email queue template
      const templateParams: INotificationTemplate = {
        username: response[2].username!,
        message: `${username} commented on your post.`,
        header: 'Comment Notification'
      };
      const template: string = notificationTemplate.notificationMessageTemplate(templateParams);
      emailQueue.AddEmailJob(COMMENT_EMAIL, { receiverEmail: response[2].email!, template, subject: 'Post notification' });
    }
  }

  // returns multiple comments for a post or a single comment for a post
  public async getPostComments(query: IQueryComment, sort: Record<string, 1 | -1>): Promise<ICommentDocument[]> {
    const comments: ICommentDocument[] = await CommentsModel.aggregate([
      { $match: query },
      { $sort: sort }
    ]);
    return comments;
  }

  // get comments name from a particular post
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
