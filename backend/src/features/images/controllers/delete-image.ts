import { REMOVE_IMAGE_FROM_DB_JOB } from '@src/constants';
import { IFileImageDocument } from '@src/features/images/interfaces/image.interface';
import { IUserDocument } from '@src/features/user/interfaces/user.interface';
import { imageService } from '@src/shared/services/db/image.service';
import { imageQueue } from '@src/shared/services/queues/image.queue';
import { UserCache } from '@src/shared/services/redis/user.cache';
import { socketIOImageObject } from '@src/shared/sockets/image';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';


const userCache: UserCache = new UserCache();

export class Delete {

  // this removes image from the db using imageID
  public async image(req: Request, res: Response): Promise<void> {
    const { imageId } = req.params;

    // issue a delete image event back to the user
    socketIOImageObject.emit('delete image', imageId);

    // this worker removes image from the db
    imageQueue.addImageJob(REMOVE_IMAGE_FROM_DB_JOB, {
      imageId
    });
    res.status(HTTP_STATUS.OK).json({ message: 'Image deleted successfully' });
  }

  public async backgroundImage(req: Request, res: Response): Promise<void> {
    //get background image id from the client
    const image: IFileImageDocument = await imageService.getImageByBackgroundId(req.params.bgImageId);
    socketIOImageObject.emit('delete image', image?._id);

    // set the bgImageID field in the user to an empty string
    const bgImageId: Promise<IUserDocument> = userCache.updateSingleUserItemInCache(
      `${req.currentUser!.userId}`,
      'bgImageId',
      ''
    ) as Promise<IUserDocument>;

        // set the bgImageVersion field in the user to an empty string
    const bgImageVersion: Promise<IUserDocument> = userCache.updateSingleUserItemInCache(
      `${req.currentUser!.userId}`,
      'bgImageVersion',
      ''
    ) as Promise<IUserDocument>;

    // execute all the above processes in parallel
    (await Promise.all([bgImageId, bgImageVersion])) as [IUserDocument, IUserDocument];

    // remove image from db
    imageQueue.addImageJob(REMOVE_IMAGE_FROM_DB_JOB, {
      imageId: image?._id
    });
    res.status(HTTP_STATUS.OK).json({ message: 'Image deleted successfully' });
  }
}
