import { BASE_PATH } from '@src/constants';
import { authRoutes as AuthRoutes } from '@src/features/auth/routes/auth-routes';
import { serverAdapter } from '@src/shared/services/queues/base.queue';
import { Application } from 'express';

export default (app: Application) => {
  const routes = () => {
    app.use('/queues', serverAdapter.getRouter());
    app.use(BASE_PATH, AuthRoutes.routes());
  };
  routes();
};
