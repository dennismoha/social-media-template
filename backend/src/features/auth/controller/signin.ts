import HTTP_STATUS from 'http-status-codes';
import { IAuthDocument } from '@src/interfaces/auth.interface';
import { joiValidation } from '@src/shared/globals/decorators/joi-validation-decorators';
import { BadRequestError } from '@src/shared/globals/helpers/error-handler';
import { authservice } from '@src/shared/services/db/auth.service';
import { Request, Response } from 'express';
import { config } from '@src/config';
import JWT from 'jsonwebtoken';
import { loginSchema } from '@src/features/auth/schemes/signin';

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
    // const user: IUserDocument = await userService.getUserByAuthId(`${existingUser._id}`);
    const user = existingUser;
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
    req.session = { jwt: userJwt };
    res.status(HTTP_STATUS.OK).json({ message: 'User login successfully', user: existingUser, token: userJwt });
  }
}
