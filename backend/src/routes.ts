
import { BASE_PATH } from '@src/constants';
import { authRoutes as AuthRoutes } from '@src/features/auth/routes/auth-routes';
import { currentUserRoutes } from '@src/features/auth/routes/currentRoutes';
import { chatRoutes } from '@src/features/chat/routes/chatRoutes';
import { commentRoutes } from '@src/features/comments/routes/commentRoutes';
import { followerRoutes } from '@src/features/follower/routes/followerRoute';
import { imageRoutes } from '@src/features/images/routes/imageRoute';
import { notificationRoutes } from '@src/features/notifications/routes/notificationRoute';
import { postRoutes } from '@src/features/post/routes/postRoutes';
import { reactionRoutes } from '@src/features/reactions/routes/reaction-route';
import { userRoutes } from '@src/features/user/routes/userRoutes';
import { authMiddleware  } from '@src/shared/globals/helpers/auth-middlewares';
import { serverAdapter } from '@src/shared/services/queues/base.queue';
import { Application } from 'express';


export default (app: Application) => {
  const routes = () => {
    app.use('/queues', serverAdapter.getRouter());
    app.use(BASE_PATH, AuthRoutes.routes());
    app.use(BASE_PATH, AuthRoutes.signoutRoute());
    app.use(BASE_PATH, authMiddleware.verifyUser, currentUserRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verifyUser, postRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verifyUser, reactionRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verifyUser, commentRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verifyUser, followerRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verifyUser, notificationRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verifyUser, imageRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verifyUser, chatRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verifyUser, userRoutes.routes());
  };
  routes();
};
