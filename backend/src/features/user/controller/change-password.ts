import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import moment from 'moment';
import publicIP from 'ip';
import { changePasswordSchema } from '@src/features/user/schemes/info';
import { BadRequestError } from '@src/shared/globals/helpers/error-handler';
import { joiValidation } from '@src/shared/globals/decorators/joi-validation-decorators';
import { authservice } from '@src/shared/services/db/auth.service';
import { IAuthDocument } from '@src/interfaces/auth.interface';
// import { userService } from '@src/shared/services/db/user.service';
import { IResetPasswordParams } from '@src/features/user/interfaces/user.interface';
import { resetPasswordTemplate } from '@src/shared/services/emails/templates/reset-password/reset-password-template';
import { emailQueue } from '@src/shared/services/queues/email.queue';
import { CHANGE_PASSWORD } from '@src/constants';

export class Update {
  @joiValidation(changePasswordSchema)
  public async password(req: Request, res: Response): Promise<void> {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (newPassword !== confirmPassword) {
      throw new BadRequestError('Passwords do not match.');
    }

    // get user by username
    const existingUser: IAuthDocument = await authservice.getAuthUserByUsername(req.currentUser!.username);

    // compare if password from user is equal to password in the db
    const passwordMatch: boolean = await existingUser.comparePassword(currentPassword);

    if (!passwordMatch) {
      throw new BadRequestError('invalid credentials');
    }

    // hash the password
    const hashedPassword: string = await existingUser.hashPassword(newPassword);

    // update the password
    await  authservice.updatePassword(`${req.currentUser!.username}`,hashedPassword);

    const templateParams: IResetPasswordParams = {
      username: existingUser.username!,
      email: existingUser.email!,
      ipaddress: publicIP.address(),
      date: moment().format('DD//MM//YYYY HH:mm')
    };
    const template: string = resetPasswordTemplate.passwordResetConfirmationTemplate(templateParams);
    emailQueue.AddEmailJob(CHANGE_PASSWORD, { template, receiverEmail: existingUser.email!, subject: 'Password update confirmation' });
    res.status(HTTP_STATUS.OK).json({
      message: 'Password updated successfully. You will be redirected shortly to the login page.'
    });
  }
}
