
import { BASE_PATH } from '@src/constants';
import { authRoutes as AuthRoutes } from '@src/features/auth/routes/auth-routes';
import { currentUserRoutes } from '@src/features/auth/routes/currentRoutes';
import { authMiddleware  } from '@src/shared/globals/helpers/auth-middlewares';
import { serverAdapter } from '@src/shared/services/queues/base.queue';
import { Application } from 'express';


export default (app: Application) => {
  const routes = () => {
    app.use('/queues', serverAdapter.getRouter());
    app.use(BASE_PATH, AuthRoutes.routes());
    app.use(BASE_PATH, AuthRoutes.signoutRoute());
    app.use(BASE_PATH, authMiddleware.verifyUser, currentUserRoutes.routes());
  };
  routes();
};
