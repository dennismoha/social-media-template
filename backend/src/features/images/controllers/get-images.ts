import { IFileImageDocument } from '@src/features/images/interfaces/image.interface';
import { imageService } from '@src/shared/services/db/image.service';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

export class Get {
  public async images(req: Request, res: Response): Promise<void> {
    // this will return all the images for either logged in user or another user the user want's the images for
    const images: IFileImageDocument[] = await imageService.getImages(req.params.userId);
    res.status(HTTP_STATUS.OK).json({ message: 'User images', images });
  }
}
