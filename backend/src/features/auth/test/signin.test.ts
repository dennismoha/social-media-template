/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { authMockRequest, authMockResponse } from '@src/mocks/auth.mock';

import { CustomError } from '@src/shared/globals/helpers/error-handler';
import { authservice } from '@src/shared/services/db/auth.service';
import { authMock } from '@src/interfaces/auth.mock-interface';
import { SignIn } from '@src/features/auth/controller/signin';
import { Helpers } from '@src/shared/globals/helpers/helpers';

describe('SigIn', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should check if username Exists', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: '',
        password: 'qwerty'
      }
    ) as Request;
    const res: Response = authMockResponse();
    SignIn.prototype.read(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Username is a required field');
    });
  });
  it('should check if username is less than the minimum character length', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'k',
        password: 'qwerty'
      }
    ) as Request;
    const res: Response = authMockResponse();
    SignIn.prototype.read(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Invalid username');
    });
  });
  it('should check if username is greater than the maximum legnth', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'Sample16',
        password: 'qwerty'
      }
    ) as Request;
    const res: Response = authMockResponse();
    SignIn.prototype.read(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Invalid username');
    });
  });

  // Password test

  it('should throw an error if password is empty', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'Sample16',
        password: ''
      }
    ) as Request;
    const res: Response = authMockResponse();
    SignIn.prototype.read(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Password is a required field');
    });
  });

  it('should throw an error if password is greater than the maximum length', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'Sample16',
        password: 'qwertysfkjsdjbsdbsjdksbjsfbsbjsfhbskfbsfbk'
      }
    ) as Request;
    const res: Response = authMockResponse();
    SignIn.prototype.read(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Invalid password');
    });
  });

  it('should throw an error if password is less than the minimum length', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'Sample16',
        password: 'q'
      }
    ) as Request;
    const res: Response = authMockResponse();
    SignIn.prototype.read(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Invalid password');
    });
  });

  it('should throw "Invalid credentials" if username does not exists', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'Sample16',
        password: 'qwerty'
      }
    ) as Request;
    const res: Response = authMockResponse();
    jest.spyOn(authservice, 'getAuthUserByUsername').mockResolvedValueOnce(null as any);

    SignIn.prototype.read(req, res).catch((error: CustomError) => {
      expect(authservice.getAuthUserByUsername).toHaveBeenCalledWith(req.body.username);
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Invalid credentials');
    });
  });

  it('should throw "Invalid credentials" if password does not exists', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'Sample16',
        password: 'Qwerty2'
      }
    ) as Request;
    const res: Response = authMockResponse();
    jest.spyOn(authservice, 'getAuthUserByUsername').mockResolvedValueOnce(null as any);

    console.log('response is ', res);
    SignIn.prototype.read(req, res).catch((error: CustomError) => {
      expect(authservice.getAuthUserByUsername).toHaveBeenCalledWith(Helpers.firstLetterToUpperCase(req.body.username));
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Invalid credentials');
    });
  });

  it.skip('should set session data for valid credentials and send correct json response', async () => {
    const req: Request = authMockRequest({}, { username:'Sample16', password: 'Qwerty1' }) as Request;
    const res: Response = authMockResponse();
    authMock.comparePassword = () => Promise.resolve(true);
    jest.spyOn(authservice, 'getAuthUserByUsername').mockResolvedValue(authMock);

    try {
      await SignIn.prototype.read(req, res);
    } catch (error) {
      console.log('buffering error is ', error);
    }

    expect(req.session?.jwt).toBeDefined();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'User login successfully',
      user: authMock,
      token: req.session?.jwt
    });
  });
});
