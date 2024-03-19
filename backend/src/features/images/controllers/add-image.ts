import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { joiValidation } from '@src/shared/globals/decorators/joi-validation-decorators';
import { addImageSchema } from '@src/features/images/scheme/images';
import { UploadApiResponse } from 'cloudinary';
import { uploads } from '@src/shared/globals/helpers/cloudinary-upload';
import { BadRequestError } from '@src/shared/globals/helpers/error-handler';
import { UserCache } from '@src/shared/services/redis/user.cache';
import { IUserDocument } from '@src/features/user/interfaces/user.interface';
import { socketIOImageObject } from '@src/shared/sockets/image';
import { imageQueue } from '@src/shared/services/queues/image.queue';
import { ADD_USER_PROFILE_IMAGE_TO_DB_JOB } from '@src/constants';

const userCache: UserCache = new UserCache();

export class Add {
  // add a profile image
  @joiValidation(addImageSchema)
  public async profileImage(req: Request, res: Response): Promise<void> {
    // upload image to cloudinary
    const result: UploadApiResponse = (await uploads(req.body.image, req.currentUser!.userId, true, true)) as UploadApiResponse;

    if (!result?.public_id) {
      throw new BadRequestError('File upload: Error occurred. Try again.');
    }
    const url = `https://res.cloudinary.com/dyamr9ym3/image/upload/v${result.version}/${result.public_id}`;

    // update the user profile picture  details in cache
    const cachedUser: IUserDocument = (await userCache.updateSingleUserItemInCache(
      `${req.currentUser!.userId}`,
      'profilePicture',
      url
    )) as IUserDocument;

    // emit a socket io response back to the user
    socketIOImageObject.emit('update user', cachedUser);

    // upload to the db by adding it in queue
    imageQueue.addImageJob(ADD_USER_PROFILE_IMAGE_TO_DB_JOB, {
      key: `${req.currentUser!.userId}`,
      value: url,
      imgId: result.public_id,
      imgVersion: result.version.toString()
    });
    res.status(HTTP_STATUS.OK).json({ message: 'Image added successfully' });
  }
}
