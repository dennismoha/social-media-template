import  { UpdateQuery } from 'mongoose';

import Logger from 'bunyan';

import { config } from '@src/config';
import { IPostDocument } from '@src/features/post/interfaces/post.interface';
import { PostModel } from '@src/features/post/models/post.schema';
import { IUserDocument } from '@src/features/user/interfaces/user.interface';
import { UserModel } from '@src/features/user/models/user.schema';



const log: Logger = config.createLogger('singup');

class PostService {
  public async addPostToDB(userId: string, createdPost: IPostDocument): Promise<void>{
    log.info('post','saving post data');

    // we save the post to the db

    const post: Promise<IPostDocument> = PostModel.create(createdPost);

    // update the number of posts a user has in the user model
    // increment it by 1

    const user: UpdateQuery<IUserDocument> = UserModel.updateOne({_id:userId}, {$inc: {postsCount:1}});

    // use promise.all to dispatch all those requests to the backend
    await Promise.all([post, user]);
  }




}

export const postService: PostService = new PostService();
