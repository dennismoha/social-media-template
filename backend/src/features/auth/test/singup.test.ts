/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import * as cloudinary from '@src/shared/globals/helpers/cloudinary-upload';
import { authMockRequest, authMockResponse } from '@src/mocks/auth.mock';
import { Signup } from '@src/features/auth/controller/signup';
import { CustomError } from '@src/shared/globals/helpers/error-handler';
import { authservice } from '@src/shared/services/db/auth.service';
import { authMock } from '@src/interfaces/auth.mock-interface';
import { UserCache } from '@src/shared/services/redis/user.cache';

jest.mock('@src/shared/services/queues/auth.queue');
jest.mock('@src/shared/services/queues/base.queue');
jest.mock('@src/shared/services/queues/user.queue');
jest.mock('@src/shared/globals/helpers/cloudinary-upload');
jest.mock('@src/shared/services/redis/user.cache');

describe('Signup', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it.skip('should throw an error if username is not available', () => {
    const req: Request = authMockRequest(
      {},
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

  it.skip('should throw an error if username length is less than minimum length', () => {
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

  it.skip('should throw an error if username length is greater than minimum length', () => {
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

  it.skip('should throw an error if email  is missing', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'sample',
        email: '',
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

  it.skip('should throw an error if email  is invalid', () => {
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

  it.skip('should throw an error if password is less than the minimum length', () => {
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
  it.skip('should throw an error if password is greater that the maximum length', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'sample6',
        email: 'manny@mail.com',
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
  it.skip('should throw an error if password is empty', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'sample6',
        email: 'manny@mail.com',
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

  // test for user existence
  it.skip('should throw unauthorize error if user arleady exists', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'sample6',
        email: 'manny@mail.com',
        password: 'qwerty',
        avatarColor: 'red',
        avatarImage: 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ=='
      }
    ) as Request;

    const res: Response = authMockResponse();
    jest.spyOn(authservice, 'getUserByNameOrEmail').mockResolvedValue(authMock);
    Signup.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('invalid credentials');
    });
  });

  // test for creating a user
  it.skip('should set session data for valid credentials and send correct json response', async () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'Sample61',
        email: 'Sample61@mail.com',
        password: 'qwerty',
        avatarColor: 'red',
        avatarImage: 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ=='
      }
    ) as Request;

    const res: Response = authMockResponse();
    jest.spyOn(authservice, 'getUserByNameOrEmail').mockResolvedValue(null as any);
    const userCacheSpy = jest.spyOn(UserCache.prototype, 'saveUserToCache');
    jest.spyOn(cloudinary, 'uploads').mockImplementation((): any => Promise.resolve({ version: '123456789', public_id: '1234567798' }));

    await Signup.prototype.create(req, res);
    expect(req.session?.jwt).toBeDefined();
    expect(res.json).toHaveBeenCalledWith({
      message: 'user created successfully',
      token: req.session?.jwt,
      user: userCacheSpy.mock.calls[0][2]
    });
  });
});
