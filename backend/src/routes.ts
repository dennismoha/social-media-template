import { BASE_PATH } from '@src/constants';
import { authRoutes  as AuthRoutes } from '@src/features/auth/routes/auth-routes';
//import { serverAdapter } from '@src/shared/services/queues/base.queue';
import { Application } from 'express';
import { ExpressAdapter } from '@bull-board/express';

let serverAdapter:ExpressAdapter;


export default (app: Application) => {

    console.log('server adpater is ', serverAdapter);
  const routes = () => {
    app.use('/queues', serverAdapter.getRouter());
    app.use(BASE_PATH, AuthRoutes.routes());
  };
  routes();
};
