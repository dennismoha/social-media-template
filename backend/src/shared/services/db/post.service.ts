import  { Query, UpdateQuery } from 'mongoose';

import Logger from 'bunyan';

import { config } from '@src/config';
import { IGetPostsQuery, IPostDocument, IQueryComplete, IQueryDeleted } from '@src/features/post/interfaces/post.interface';
import { PostModel } from '@src/features/post/models/post.schema';
import { IUserDocument } from '@src/features/user/interfaces/user.interface';
import { UserModel } from '@src/features/user/models/user.schema';



const log: Logger = config.createLogger('post');

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

  public async getPosts(query: IGetPostsQuery, skip=0,limit=0, sort:Record<string, 1 | -1> ): Promise<IPostDocument[]>{
    let postQuery = {};

    // check if  the query contains imgd and gifurl
    if(query?.imgId && query?.gifUrl){
      postQuery = {$or: [{imgId:{$ne: ''}}, {gifUrl:{$ne: ''}}]}; // returns payload where imgId or gifUrl is not empty
    }else {
      postQuery = query;
    }

    const posts: IPostDocument[] = await PostModel.aggregate([
      {$match: postQuery},
      {$sort: sort},
      {$skip: skip},
      {$limit: limit}
    ]);

    return posts;
  }

  //  counts the number of posts you have in a collection

  public async postsCount(): Promise<number>{
    const count: number = await PostModel.find({}).countDocuments();
    return count;
  }

  // delete posts from db
  public async deletePost(postId: string, userId: string): Promise<void>{
    const deletePost: Query<IQueryComplete & IQueryDeleted, IPostDocument  > =  PostModel.deleteOne({_id: postId});
    const decrementPostCount: UpdateQuery<IUserDocument> =  UserModel.updateOne({_id: userId}, {$inc: {postsCount: -1}});

    await Promise.all([deletePost, decrementPostCount]);

  }

}

export const postService: PostService = new PostService();
