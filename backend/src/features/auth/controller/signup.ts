import  HTTP_STATUS  from 'http-status-codes';
import { signupSchema } from '@src/features/auth/schemes/signup';
import { IAuthDocument, ISignUpData } from '@src/interfaces/auth.interface';
import { joiValidation } from '@src/shared/globals/decorators/joi-validation-decorators';
import { uploads } from '@src/shared/globals/helpers/cloudinary-upload';
import { BadRequestError } from '@src/shared/globals/helpers/error-handler';
import { Helpers } from '@src/shared/globals/helpers/helpers';
import { authservice } from '@src/shared/services/db/auth.service';
import { UploadApiResponse } from 'cloudinary';
import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import Logger from 'bunyan';
import { IUserDocument } from '@src/features/user/interfaces/user.interface';
import { UserCache } from '@src/shared/services/redis/user.cache';
import { config } from '@src/config';
import { omit } from 'lodash';
import { authQueue } from '@src/shared/services/queues/auth.queue';
import { ADD_AUTH_USER_TO_JOB, ADD_USER_TO_JOB } from '@src/constants';
import { userQueue } from '@src/shared/services/queues/user.queue';
import  JWT from 'jsonwebtoken';


const log: Logger = config.createLogger('singup');


const userCache:UserCache = new UserCache();
const CLOUD_NAME = config.CLOUD_NAME;

export class Signup {
  @joiValidation(signupSchema)
  public async create(req: Request, res: Response): Promise<void> {
    const { username, email, password, avatarColor, avatarImage } = req.body;
    const checkIfUserExists: IAuthDocument = await authservice.getUserByNameOrEmail(username, email);
    if (checkIfUserExists) {
      throw new BadRequestError('invalid credentials');
    }

    // const authObjectId: ObjectId = new ObjectId();
    // const userObjectId: ObjectId = authObjectId;
    const authObjectId: ObjectId = new ObjectId();
    const userObjectId: ObjectId = new ObjectId();
    const uid = `${Helpers.generateRandomIntegers(12)}`;

    const authData: IAuthDocument = Signup.prototype.signupData({
      _id: authObjectId,
      uId: uid,
      email,
      username,
      password,
      avatarColor
    });

    // upload to cloudinary
    const result: UploadApiResponse = (await uploads(avatarImage, `${userObjectId}`, true, true)) as UploadApiResponse;

    if (!result?.public_id) {
      throw new BadRequestError('fie upload: Error occured. ');
    }

    //add data to redis
    const userDataForCache: IUserDocument = Signup.prototype.userData(authData, userObjectId );
    log.info('auth data before redis is  in the signup data ', authData);
    log.info('user object id data before redis is  in the signup data ', userObjectId);
    log.info('user data for cache is  before redis is  in the signup data ', userDataForCache);

    userDataForCache.profilePicture = `http://res.cloudinary.com/${ CLOUD_NAME}/image/upload/v${result.version}/${userObjectId}`;
    await userCache.saveUserToCache(`${userObjectId}`, uid, userDataForCache);

    // add to database
    omit(userDataForCache,['uid','email', 'avatacolor','password']);
    log.info('user data for cache is  after lodash ommission is  in the signup data ', userDataForCache);
    authQueue.AddAuthUserJob(ADD_AUTH_USER_TO_JOB,{value: authData});
    userQueue.AddUserJob(ADD_USER_TO_JOB, {value: userDataForCache});

    const userJwt: string = Signup.prototype.signToken(authData,userObjectId);
    req.session = {jwt: userJwt};

    res.status(HTTP_STATUS.CREATED).json({ message: 'user created successfully', authData, token:userJwt });
  }

  // jwt logic during signup

  public signToken(data: IAuthDocument, userObjectId: ObjectId): string {
    return JWT.sign(
      {
        userId: userObjectId,
        uId: data.uId,
        email: data.email,
        username: data.username,
        avatarColor: data.avatarColor
      },
      config.JWT_TOKEN!
    );
  }

  private signupData(data: ISignUpData): IAuthDocument {
    const { _id, uId, email, username, password, avatarColor } = data;
    log.info('id in the signup data ', _id);
    return {
      _id,
      uId,
      email,
      username,
      password,
      avatarColor,
      createdAt: new Date()
    } as IAuthDocument;
  }

  private userData(data: IAuthDocument, userObjectId: ObjectId): IUserDocument {
    const { _id, username, email, uId, password, avatarColor } = data;
    return {
      _id: userObjectId,
      authId: _id,
      uId,
      username: Helpers.firstLetterToUpperCase(username),
      email,
      password,
      avatarColor,
      profilePicture: '',
      blocked: [],
      blockedBy: [],
      work: '',
      location: '',
      school: '',
      quote: '',
      bgImageVersion: '',
      bgImageId: '',
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      notifications: {
        messages: true,
        reactions: true,
        comments: true,
        follows: true
      },
      social: {
        facebook: '',
        instagram: '',
        twitter: '',
        youtube: ''
      }
    } as unknown as IUserDocument;
  }
}
