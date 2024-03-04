import { ObjectId } from 'mongodb';
import HTTP_STATUS from 'http-status-codes';
import { IPostDocument } from '@src/features/post/interfaces/post.interface';
import { postSchema, postWithImageSchema } from '@src/features/post/schemes/post.schemes';
import { joiValidation } from '@src/shared/globals/decorators/joi-validation-decorators';
import { Request, Response } from 'express';
import { PostCache } from '@src/shared/services/redis/post.cache';
import { SocketIOPostObject } from '@src/shared/sockets/posts';
import { postQueue } from '@src/shared/services/queues/post.queue';
import { ADD_USER_POST_TO_JOB } from '@src/constants';
import { UploadApiResponse } from 'cloudinary';
import { uploads } from '@src/shared/globals/helpers/cloudinary-upload';
import { BadRequestError } from '@src/shared/globals/helpers/error-handler';
import { postService } from '@src/shared/services/db/post.service';

const postCache: PostCache = new PostCache();
const PAGE_SIZE = 10;

export class GetPosts {
  // fetch posts without images from db and cache
  public async fetchPost(req: Request, res: Response): Promise<void> {
    const {page} = req.params;

    // the following is used for fetching data from mongo db. for pagination purposes

    const skip: number = (parseInt(page) - 1) * PAGE_SIZE;
    const limit: number = PAGE_SIZE * parseInt(page);

    // the following is used for fetching data from redis. for pagination purposes

    const newSkip: number = skip === 0 ? skip: skip + 1;

    let posts: IPostDocument[] = [];
    let totalPosts = 0;

    // the following query is used to fetch data from cache
    // NB: posts parameter here is the set name on redis
    const cachedPosts: IPostDocument[] = await postCache.getPostsFromCache('post',newSkip, limit );

    //
    if(cachedPosts.length) {
      posts = cachedPosts;
      totalPosts = await postCache.getTotlaNumberOfPostsFromCache();
    }else {
      // if no posts in cache we fetch posts from the database
      posts = await postService.getPosts({}, skip, limit, {createdAt: -1});
      totalPosts = await postService.postsCount();
    }

    res.status(HTTP_STATUS.OK).json({message: 'All posts', posts, totalPosts});

  }


  // fetch posts with images from db and cache
  public async fetchPostsWithImages(req: Request, res: Response): Promise<void> {
    const {page} = req.params;

    // the following is used for fetching data from mongo db. for pagination purposes

    const skip: number = (parseInt(page) - 1) * PAGE_SIZE;
    const limit: number = PAGE_SIZE * parseInt(page);

    // the following is used for fetching data from redis. for pagination purposes

    const newSkip: number = skip === 0 ? skip: skip + 1;

    let posts: IPostDocument[] = [];


    // the following query is used to fetch posts with images from cache
    // NB: posts parameter here is the set name on redis
    const cachedPosts: IPostDocument[] = await postCache.getPostsWithImagesFromCache('post',newSkip, limit );


    // since we've not implemented a method for getting the total number of posts with images then we do this:

    posts = cachedPosts.length ? cachedPosts:  await postService.getPosts({imgId: '$ne', gifUrl: '$ne'}, skip, limit, {createdAt: -1});

    res.status(HTTP_STATUS.OK).json({message: 'All posts with images', posts});

  }


}
