import { AuthPayload } from '@src/interfaces/auth.interface';
import { IAuthMock, IJWT } from '@src/interfaces/auth.mock-interface';
import { Response } from 'express';




// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const authMockRequest = (sessionData: IJWT, body:IAuthMock, currentUser?:AuthPayload | null, params?:any) =>({
  session: sessionData,
  body,
  params,
  currentUser
});

export const authMockResponse =(): Response =>{
  const res: Response = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};
