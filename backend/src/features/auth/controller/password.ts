import { Request, Response } from 'express';
import moment from 'moment';
import publicIp from 'ip';
import HTTP_STATUS from 'http-status-codes';
import { config } from '@src/config';
import { joiValidation } from '@src/shared/globals/decorators/joi-validation-decorators';
import { emailSchema, passwordSchema } from '@src/features/auth/schemes/password';
import { IAuthDocument } from '@src/interfaces/auth.interface';
import { authservice } from '@src/shared/services/db/auth.service';
import { BadRequestError } from '@src/shared/globals/helpers/error-handler';
import crypto from 'crypto';
import { forgotPasswordTemplate } from '@src/shared/services/emails/templates/forgot-password/forgot-password-template';
import { emailQueue } from '@src/shared/services/queues/email.queue';
import { FORGOT_PASSWORD, RECEIVER_EMAIL } from '@src/constants';
import { resetPasswordTemplate } from '@src/shared/services/emails/templates/reset-password/reset-password-template';
import { IResetPasswordParams } from '@src/features/user/interfaces/user.interface';

export class Password {
  @joiValidation(emailSchema)
  public async create(req: Request, res: Response): Promise<void> {
    const { email } = req.body;

    // check if user exists in the database
    const existingUser: IAuthDocument = await authservice.getAuthUserByEmail(email);

    if (!existingUser) {
      throw new BadRequestError(' invalid credentials');
    }

    // if user exists,
    // create  a buffer
    const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
    // convert buffer to string
    const randomCharacters: string = randomBytes.toString('hex');

    // update the db
    await authservice.updatePasswordToken(`${existingUser._id!}`, randomCharacters, Date.now() * 60 * 60 * 1000);

    // add to queue to later send it to the user
    const resetLink = `${config.CLIENT_URL}/reset-password?token=${randomCharacters}`;
    //const template: string = resetPasswordTemplate.passwordResetConfirmationTemplate(templateParams);
    const template: string = forgotPasswordTemplate.passwordResetTemplate(existingUser.username!, resetLink);
    emailQueue.AddEmailJob(FORGOT_PASSWORD, {
      receiverEmail: RECEIVER_EMAIL,
      template,
      subject: 'password reset confirmation'
    });
    res.status(HTTP_STATUS.OK).json({ message: 'password reset email sent' });
  }

  @joiValidation(passwordSchema)
  public async update(req: Request, res: Response): Promise<void> {
    const { password, confirmPassword } = req.body;
    const { token } = req.params;

    if (password !== confirmPassword) {
      throw new BadRequestError('password do not match');
    }

    // check if password with that token exists and not expired in the database
    const existingUser: IAuthDocument = await authservice.getAuthUserByPasswordToken(token);

    if (!existingUser) {
      throw new BadRequestError('Reset token expired');
    }

    // if user exists,
    existingUser.password = password;
    existingUser.passwordResetExpires = undefined;
    existingUser.passwordResetToken = undefined;

    // save the new password to the dbl
    await existingUser.save();

    // add email info to queue to inform the user password was changed successfully
    const templateParams: IResetPasswordParams = {
      username: existingUser.username!,
      email: existingUser.email!,
      ipaddress: publicIp.address(),
      date: moment().format('DD/MM/YY HH:mm')
    };

    const template: string = resetPasswordTemplate.passwordResetConfirmationTemplate(templateParams);
    emailQueue.AddEmailJob(FORGOT_PASSWORD, {
      receiverEmail: RECEIVER_EMAIL,
      template,
      subject: 'password reset confirmation'
    });
    res.status(HTTP_STATUS.OK).json({ message: 'password reset successfully' });
  }
}

export const password: Password = new Password();
