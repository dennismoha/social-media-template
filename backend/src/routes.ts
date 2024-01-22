import { BASE_PATH } from '@src/constants';
import { authRoutes  as AuthRoutes } from '@src/features/auth/routes/auth-routes';
import { Application } from 'express';



export default (app: Application) => {
  const routes = () => {
    app.use(BASE_PATH, AuthRoutes.routes());
  };
  routes();
};
