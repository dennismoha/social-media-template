import { Request, Response } from 'express';
import * as cloudinary from '@src/shared/globals/helpers/cloudinary-upload';
import { authMockRequest, authMockResponse } from '@src/mocks/auth.mock';
import { AVATART_IMAGE } from '@src/constants';
import { Signup } from '@src/features/auth/controller/signup';
import { CustomError } from '@src/shared/globals/helpers/error-handler';

jest.mock('@src/shared/services/queues/auth.queue');
jest.mock('@src/shared/services/queues/base.queue');
jest.mock('@src/shared/services/queues/user.queue');
jest.mock('@src/shared/globals/helpers/cloudinary-upload');
jest.mock('@src/shared/services/redis/user.cache');

describe('Signup', () => {
  it('should throw an error if username is not available', () => {
    const req: Request = authMockRequest({},
      {
        username: '',
        email: 'manny@test.com',
        password: 'qwerty',
        avatarColor: 'red',
        avatarImage: 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ=='
      }
    ) as Request;

    const res: Response = authMockResponse();
    Signup.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Username is a required field');
    });
  });

  it('should throw an error if username length is less than minimum length', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'mm',
        email: 'manny@test.com',
        password: 'qwerty',
        avatarColor: 'red',
        avatarImage: 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ=='
      }
    ) as Request;

    const res: Response = authMockResponse();
    Signup.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Invalid username');
    });
  });

  it('should throw an error if username length is greater than minimum length', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'matheakjbdskbdkb',
        email: 'manny@test.com',
        password: 'qwerty',
        avatarColor: 'red',
        avatarImage: 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ=='
      }
    ) as Request;

    const res: Response = authMockResponse();
    Signup.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Invalid username');
    });
  });

  it('should throw an error if email  is missing', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'sample',
        email:'',
        password: 'qwerty',
        avatarColor: 'red',
        avatarImage: 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ=='
      }
    ) as Request;

    const res: Response = authMockResponse();
    Signup.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Email is a required field');
    });
  });

  it('should throw an error if email  is invalid', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'sample6',
        email: 'manny',
        password: 'qwerty',
        avatarColor: 'red',
        avatarImage: 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ=='
      }
    ) as Request;

    const res: Response = authMockResponse();
    Signup.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Email must be valid');
    });
  });

  // password test

  it('should throw an error if password is less than the minimum length', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'sample6',
        email: 'manny@mail.com',
        password: 'q',
        avatarColor: 'red',
        avatarImage: 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ=='
      }
    ) as Request;

    const res: Response = authMockResponse();
    Signup.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Invalid password');
    });
  });
  it('should throw an error if password is greater that the maximum length', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'sample6',
        email: 'manny',
        password: 'qwertyasjknadbsajdmbsdjnmdajbshjbfbsfbjshbfj',
        avatarColor: 'red',
        avatarImage: 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ=='
      }
    ) as Request;

    const res: Response = authMockResponse();
    Signup.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Invalid password');
    });
  });
  it('should throw an error if password is empty', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'sample6',
        email: 'manny',
        password: '',
        avatarColor: 'red',
        avatarImage: 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ=='
      }
    ) as Request;

    const res: Response = authMockResponse();
    Signup.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Password is a required field');
    });
  });
});
