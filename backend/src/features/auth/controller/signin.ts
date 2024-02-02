import HTTP_STATUS from 'http-status-codes';
import { IAuthDocument } from '@src/interfaces/auth.interface';
import { joiValidation } from '@src/shared/globals/decorators/joi-validation-decorators';
import { BadRequestError } from '@src/shared/globals/helpers/error-handler';
import { authservice } from '@src/shared/services/db/auth.service';
import { Request, Response } from 'express';
import { config } from '@src/config';
import JWT from 'jsonwebtoken';
import { loginSchema } from '@src/features/auth/schemes/signin';
import { IUserDocument } from '@src/features/user/interfaces/user.interface';
import { userService } from '@src/shared/services/db/user.service';
import { mailTransport } from '@src/shared/services/emails/mail.transport';

export class SignIn {
  @joiValidation(loginSchema)
  public async read(req: Request, res: Response): Promise<void> {
    const { username, password } = req.body;
    const existingUser: IAuthDocument = await authservice.getAuthUserByUsername(username);
    if (!existingUser) {
      throw new BadRequestError('Invalid credentials');
    }
    const passwordsMatch: boolean = await existingUser.comparePassword(password);
    if (!passwordsMatch) {
      throw new BadRequestError('Invalid credentials');
    }

    const user: IUserDocument = await userService.getUserByAuthId(`${existingUser._id}`);
    const userJwt: string = JWT.sign(
      {
        userId: user._id,
        uId: existingUser.uId,
        email: existingUser.email,
        username: existingUser.username,
        avatarColor: existingUser.avatarColor
      },
      config.JWT_TOKEN!
    );

    await mailTransport.sendeEmail(' hillary.fritsch23@ethereal.email', 'email testing', 'this is the email test');

    req.session = { jwt: userJwt };

    const userDocument: IUserDocument = {
      ...user,
      authId: existingUser!._id,
      username: existingUser!.username,
      email: existingUser!.email,
      avatarColor: existingUser!.avatarColor,
      uId: existingUser!.uId,
      createdAt: existingUser!.createdAt
    } as IUserDocument;
    req.session = { jwt: userJwt };

    res.status(HTTP_STATUS.OK).json({ message: 'User login successfully', user: userDocument, token: userJwt });
  }
}
