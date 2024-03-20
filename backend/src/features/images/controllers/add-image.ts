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
import { ADD_USER_PROFILE_IMAGE_TO_DB_JOB, UPDATE_BACKGROUND_IMAGE_TO_DB_JOB } from '@src/constants';
import { IBgUploadResponse } from '@src/features/images/interfaces/image.interface';
import { Helpers } from '@src/shared/globals/helpers/helpers';
import Logger from 'bunyan';
import { config } from '@src/config';

const userCache: UserCache = new UserCache();
const log: Logger = config.createLogger('commentsCache');

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

  // background picture upload
  @joiValidation(addImageSchema)
  public async backgroundImage(req: Request, res: Response): Promise<void> {
    // upload the image
    const { version, publicId }: IBgUploadResponse = await Add.prototype.backgroundUpload(req.body.image);

    /*
      remember for each url it needs a public id and version from cloudinary.
      so after the upload of either a new image or converting a pre-existing image to a background image,
      we have to update the imageVersion and image public id in both cache and DB
    */

    // updates the bgImageId in the user cache
    const bgImageId: Promise<IUserDocument> = userCache.updateSingleUserItemInCache(
      `${req.currentUser!.userId}`,
      'bgImageId',
      publicId
    ) as Promise<IUserDocument>;

    // updates the image version in cache for that specific user
    const bgImageVersion: Promise<IUserDocument> = userCache.updateSingleUserItemInCache(
      `${req.currentUser!.userId}`,
      'bgImageVersion',
      version
    ) as Promise<IUserDocument>;

    // use promise.all to execute the above processes
    const response: [IUserDocument, IUserDocument] = (await Promise.all([bgImageId, bgImageVersion])) as [IUserDocument, IUserDocument];

    // use socket io to update  the user
    socketIOImageObject.emit('update user', {
      bgImageId: publicId,
      bgImageVersion: version,
      userId: response[0]
    });

    // add images to queue so as to push them in the db
    // this pushes the new updates for the background image
    imageQueue.addImageJob(UPDATE_BACKGROUND_IMAGE_TO_DB_JOB, {
      key: `${req.currentUser!.userId}`,
      imgId: publicId,
      imgVersion: version.toString()
    });
    res.status(HTTP_STATUS.OK).json({ message: 'Image added successfully' });
  }

  // checks if a user is uploading a new image or selecting an old image for upload especially for the background

  private async backgroundUpload(image: string): Promise<IBgUploadResponse> {
    // check if image is 64 base encoded
    const isDataURL = Helpers.isDataURL(image);
    let version, publicId;

    if (isDataURL) {
      /*
        if it's 64 base encoded then user is uploading a  new image
       upload image to cloudinary
       we upload it without  a public id , overwrite false and invalidate is false

       */
      const result: UploadApiResponse = (await uploads(image)) as UploadApiResponse;
      if (!result.public_id) {
        log.error('error uploading image');
        throw new BadRequestError(result.message);
      } else {
        version = result.version.toString();
        publicId = result.public_id;
      }
    } else {
      /*
       the image is an old uploaded .
       the url looks like this. http://res.cloudinary.com/dweotvmle/image/upload/v1710417256/65f2e567186a7077da7d0e60
       so we split it at the '/'

       */
      const value = image.split('/');
      version = value[value.length - 2]; // gives you the second last item
      publicId = value[value.length - 1]; // gets the last element
    }

    // the replace below in the version replaces the first v in the version with an empty string
    return { version: version.replace(/v/g, ''), publicId };
  }
}
