import { omit } from 'lodash';
import { IPostDocument } from '@src/features/post/interfaces/post.interface';
import { PostModel } from '@src/features/post/models/post.schema';
import { IQueryReaction, IReactionDocument, IReactionJob } from '@src/features/reactions/interfaces/reaction.interface';
import { ReactionModel } from '@src/features/reactions/model/reaction.schema';
import { IUserDocument } from '@src/features/user/interfaces/user.interface';
import { BadRequestError } from '@src/shared/globals/helpers/error-handler';
import { UserCache } from '@src/shared/services/redis/user.cache';
import mongoose from 'mongoose';
import { Helpers } from '@src/shared/globals/helpers/helpers';

const userCache: UserCache = new UserCache();
class ReactionService {
  // adds reaction data to db
  public async addReactionDataToDB(reactionData: IReactionJob): Promise<void> {
    try {
      // userTo and userFrom will be used in updating the notification
      const { postId, userTo, userFrom, username, type, previousReaction, reactionObject } = reactionData;

      let updatedReactionObject: IReactionDocument = reactionObject as IReactionDocument;
      if (previousReaction) {
        updatedReactionObject = omit(reactionObject, ['_id']);
      }

      console.log('about to enter the model');
      console.log('userdata is ', reactionData);

      console.log('post id:', postId);
      console.log('the reaction object ', reactionObject);

      const updatedReaction: [IUserDocument, IReactionDocument, IPostDocument] = (await Promise.all([
        //we get the userdata from the cache
        userCache.getUserFromCache(`${userTo}`),
        // if the previous reaction exists, replace the document with the new reactionObject document. else create a new document
        ReactionModel.replaceOne({ postId, type: previousReaction, username }, updatedReactionObject, { upsert: true }),
        // the update the post document with that postId
        PostModel.findOneAndUpdate(
          { _id: postId },
          {
            $inc: {
              [`reactions.${previousReaction}`]: -1,
              [`reactions.${type}`]: 1
            }
          },
          { new: true }
        )
      ])) as unknown as [IUserDocument, IReactionDocument, IPostDocument];

      // send notifications

      console.log(updatedReaction);
    } catch (error) {
      console.error('error adding reaction', error);
      throw new BadRequestError(`error adding reaction ${JSON.stringify(error)} `);
    }
  }

  // removing reaction from db

  // public async removeReactionDataFromDB(reactionData: IReactionJob): Promise<void> {
  //   // delete one from the reaction model
  //   const { postId, username, previousReaction } = reactionData;
  //   await Promise.all([
  //     ReactionModel.deleteOne({ postId, username, previousReaction }),
  //     PostModel.updateOne(
  //       { _id: postId },
  //       {
  //         $inc: {
  //           [`reactions.${previousReaction}`]: -1
  //         }
  //       },
  //       { new: true }
  //     )
  //   ]);
  // }
  public async removeReactionDataFromDB(reactionData: IReactionJob): Promise<void> {
    const { postId, previousReaction, username } = reactionData;
    await Promise.all([
      ReactionModel.deleteOne({ postId, type: previousReaction, username }),
      PostModel.updateOne(
        { _id: postId },
        {
          $inc: {
            [`reactions.${previousReaction}`]: -1
          }
        },
        { new: true }
      )
    ]);
  }

  // Get all reactions for a particular post
  public async getPostReactions(query: IQueryReaction, sort: Record<string, 1 | -1>): Promise<[IReactionDocument[], number]> {
    const reactions: IReactionDocument[] = await ReactionModel.aggregate([{ $match: query }, { $sort: sort }]);
    return [reactions, reactions.length];
  }

  // Get a single reactions By username

  public async getSinglePostReactionByUsername(postId: string, username: string): Promise<[IReactionDocument, number] | []> {
    const reactions: IReactionDocument[] = await ReactionModel.aggregate([
      { $match: { postId: new mongoose.Types.ObjectId(postId), username: Helpers.firstLetterToUpperCase(username) } }
    ]);
    return reactions.length ? [reactions[0], 1] : [];
  }

  // Get reactions from the reaction collection that matches this username irrespective of the post
  public async getReactionsByUsername(username: string): Promise<IReactionDocument[]> {
    const reactions: IReactionDocument[] = await ReactionModel.aggregate([
      { $match: { username: Helpers.firstLetterToUpperCase(username) } }
    ]);
    return reactions;
  }
}

export const reactionService: ReactionService = new ReactionService();
