import {
  ADD_IMAGE_TO_DB_JOB,
  ADD_USER_PROFILE_IMAGE_TO_DB_JOB,
  REMOVE_IMAGE_FROM_DB_JOB,
  UPDATE_BACKGROUND_IMAGE_TO_DB_JOB
} from '@src/constants';
import { IFileImageJobData } from '@src/features/images/interfaces/image.interface';
import { BaseQueue } from '@src/shared/services/queues/base.queue';
import { imageWorker } from '@src/shared/workers/image.worker';

class ImageQueue extends BaseQueue {
  constructor() {
    super('images');
    this.processJob(ADD_USER_PROFILE_IMAGE_TO_DB_JOB, 5, imageWorker.addUserProfileImageToDB);
    this.processJob(UPDATE_BACKGROUND_IMAGE_TO_DB_JOB, 5, imageWorker.updateBGImageInDB);
    this.processJob(ADD_IMAGE_TO_DB_JOB, 5, imageWorker.addImageToDB);
    this.processJob(REMOVE_IMAGE_FROM_DB_JOB, 5, imageWorker.removeImageFromDB);
  }

  public addImageJob(name: string, data: IFileImageJobData): void {
    this.addJob(name, data);
  }
}

export const imageQueue: ImageQueue = new ImageQueue();
