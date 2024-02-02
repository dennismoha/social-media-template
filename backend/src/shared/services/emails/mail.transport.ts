import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import Logger from 'bunyan';
import sendGridMail from '@sendgrid/mail';
import { config } from '@src/config';
import { BadRequestError } from '@src/shared/globals/helpers/error-handler';


interface IMailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
}

const log: Logger = config.createLogger('mailsOption');

sendGridMail.setApiKey(config.SENDGRID_API_KEY!);

class  MailTransport {

  public async sendeEmail(receiverEmail: string, subject: string, body:string): Promise<void>{
    if(config.NODE_ENV === 'test' || config.NODE_ENV ==='development'){
      this.developmentEmailSender(receiverEmail, subject, body);
    }else {
      this.productionEmailSender(receiverEmail,  subject, body);
    }
  }

  private async developmentEmailSender(receiverEmail: string, subject: string, body:string): Promise<void>{
    const transporter: Mail = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: config.SENDER_EMAIL!,
        pass: config.SENDER_EMAIL_PASSWORD!,
      },
    });
    const mailOptions: IMailOptions = {
      from: `social media test <${config.SENDER_EMAIL!}>`,
      to: receiverEmail,
      subject,
      html: body

    };

    try {
      await transporter.sendMail(mailOptions);
      log.info(' development email sending');
    } catch (error) {
      log.error('Error sending email ', error);
      throw new BadRequestError('error sending email');
    }
  }
  private async productionEmailSender(receiverEmail: string, subject: string, body:string): Promise<void>{
    const mailOptions: IMailOptions = {
      from: `social media test <${config.SENDER_EMAIL!}>`,
      to: receiverEmail,
      subject,
      html: body

    };

    try {
      await sendGridMail.send(mailOptions);
      log.info(' production email sending');
    } catch (error) {
      log.error('Error sending email ', error);
      throw new BadRequestError('error sending email');
    }
  }

}

export const mailTransport:MailTransport  = new MailTransport();





