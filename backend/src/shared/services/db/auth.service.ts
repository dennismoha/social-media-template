import { AuthModel } from '@src/features/models/auth.schema';
import { IAuthDocument } from '@src/interfaces/auth.interface';
import { Helpers } from '@src/shared/globals/helpers/helpers';

class Authservice {
  public async getUserByNameOrEmail(username: string, email: string): Promise<IAuthDocument> {
    const query = {
      $or: [{ username: Helpers.firstLetterToUpperCase(username) }, { email: Helpers.lowerCase(email) }]
    };
  const user: IAuthDocument  = await AuthModel.findOne(query).exec() as IAuthDocument;
  return user;
  }
}

export const authservice: Authservice = new Authservice()
