import { UserModel } from '@src/features/user/models/user.schema';
import { IAuthDocument } from '@src/interfaces/auth.interface';


class UserService {
  // this methods creates a user to the db:
  // we use it in our auth.worker.ts

  public async addUserData(data: IAuthDocument): Promise<void>{
    await UserModel.create(data);
  }
}

export const userService: UserService = new UserService();
