import { IFileImageDocument } from '@src/features/images/interfaces/image.interface';
import { ImageModel } from '@src/features/images/models/image.schema';
import { UserModel } from '@src/features/user/models/user.schema';
import mongoose from 'mongoose';

class ImageService {
  // function to create user profile image

  public async addUserProfileImageToDB(userId: string, url: string, imgId: string, imgVersion: string): Promise<void> {
    // update profile in the user collection
    await UserModel.updateOne({ _id: userId }, { $set: { profilePicture: url } }).exec();

    // create document inside the image document
    await this.addImage(userId, imgId, imgVersion, 'profile');
  }

  // add background image to db
  public async addBackgroundImageToDB(userId: string, url: string, imgId: string, imgVersion: string): Promise<void> {
    // update profile in the user collection
    await UserModel.updateOne({ _id: userId }, { $set: { bgImageId: imgId, bgImageVersion: imgVersion } }).exec();

    // create document inside the image document
    await this.addImage(userId, imgId, imgVersion, 'background');
  }

  // utility function to create either the profile picture/ background picture document in the db

  public async addImage(userId: string, imgId: string, imgVersion: string, type: string): Promise<void> {
    await ImageModel.create({
      userId,
      bgImageVersion: type === 'background' ? imgVersion : '',
      bgImageId: type === 'background' ? imgId : '',
      imgVersion,
      imgId
    });
  }

  // function to remove / get image from image collection
  public async removeImageFromDB(imageId: string): Promise<void> {
    await ImageModel.deleteOne({ _id: imageId }).exec();
  }

  // retrieve background image
  public async getImageByBackgroundId(bgImageId: string): Promise<IFileImageDocument> {
    const image: IFileImageDocument = (await ImageModel.findOne({ bgImageId }).exec()) as IFileImageDocument;
    return image;
  }

  // retrieves all images for a particular user
  public async getImages(userId: string): Promise<IFileImageDocument[]> {
    const images: IFileImageDocument[] = await ImageModel.aggregate([{ $match: { userId: new mongoose.Types.ObjectId(userId) } }]);
    return images;
  }
}

export const imageService: ImageService = new ImageService();
