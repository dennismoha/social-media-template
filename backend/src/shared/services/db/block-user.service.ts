import mongoose, { ObjectId } from 'mongoose';
import { PushOperator } from 'mongodb';
import { UserModel } from '@src/features/user/models/user.schema';

class BlockUserService {
  public async blockUser(userId: string, followerId: string): Promise<void> {
    const id = userId as unknown as ObjectId;
    const follower_id = followerId as unknown as ObjectId;
    UserModel.bulkWrite([
      {
        updateOne: {
          // if the follower id does not exist in the blocked array list and the userId equals the
          // logged in user id then we return that document
          filter: { _id: id, blocked: { $ne: new mongoose.Types.ObjectId(followerId) } },
          // push the follower id into the list
          update: {
            $push: {
              blocked: new mongoose.Types.ObjectId(followerId)
            } as PushOperator<Document>
          }
        }
      },
      {
        // if the logged in user blocks a user k, the blocked by list of user k will get populated with the id of the user who blocked him
        updateOne: {
          filter: { _id: follower_id, blockedBy: { $ne: new mongoose.Types.ObjectId(userId) } },
          update: {
            $push: {
              blockedBy: new mongoose.Types.ObjectId(userId)
            } as PushOperator<Document>
          }
        }
      }
    ]);
  }

  public async unblockUser(userId: string, followerId: string): Promise<void> {
    UserModel.bulkWrite([
      {
        updateOne: {
          filter: { _id: userId },
          update: {
            $pull: {
              // deleting an item from a list
              blocked: new mongoose.Types.ObjectId(followerId)
            } as PushOperator<Document>
          }
        }
      },
      {
        updateOne: {
          filter: { _id: followerId },
          update: {
            $pull: {
              blockedBy: new mongoose.Types.ObjectId(userId)
            } as PushOperator<Document>
          }
        }
      }
    ]);
  }
}

export const blockUserService: BlockUserService = new BlockUserService();
