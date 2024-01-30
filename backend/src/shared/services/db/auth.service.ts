import { AuthModel } from '@src/features/auth/models/auth.schema';
import { IAuthDocument } from '@src/interfaces/auth.interface';
import { Helpers } from '@src/shared/globals/helpers/helpers';
import Logger from 'bunyan';

import { config } from '@src/config';



const log: Logger = config.createLogger('singup');

class Authservice {
  // this methods creates a user to the db:
  // we use it in our auth.worker.ts

  public async createAuthUser(data: IAuthDocument): Promise<void>{
    log.error('create auth user ', data);
    await AuthModel.create(data);
  }

  public async getUserByNameOrEmail(username: string, email: string): Promise<IAuthDocument> {
    const query = {
      $or: [{ username: Helpers.firstLetterToUpperCase(username) }, { email: Helpers.lowerCase(email) }]
    };
  const user: IAuthDocument  = await AuthModel.findOne(query).exec() as IAuthDocument;
  return user;
  }
  public async getAuthUserByUsername(username: string): Promise<IAuthDocument> {
    log.error('username in get auth by username ', username);
    log.error('username:::: in get auth by username ', Helpers.firstLetterToUpperCase(username) );
    const user: IAuthDocument = (await AuthModel.findOne({ username: Helpers.firstLetterToUpperCase(username) }).exec()) as IAuthDocument;
    return user;
  }

  public async getAuthUserByEmail(email: string): Promise<IAuthDocument> {
    const user: IAuthDocument = (await AuthModel.findOne({ email: Helpers.lowerCase(email) }).exec()) as IAuthDocument;
    return user;
  }


}

export const authservice: Authservice = new Authservice();
