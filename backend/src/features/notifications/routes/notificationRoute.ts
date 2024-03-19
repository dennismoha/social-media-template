import { Delete } from '@src/features/notifications/controllers/delete-notification';
import { Get } from '@src/features/notifications/controllers/get-notifications';
import { Update } from '@src/features/notifications/controllers/update-notifications';
import { authMiddleware } from '@src/shared/globals/helpers/auth-middlewares';
import express, { Router } from 'express';

class NotificationRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.get('/notifications', authMiddleware.checkAuthentication, Get.prototype.notifications);
    this.router.put('/notification/:notificationId', authMiddleware.checkAuthentication, Update.prototype.notification);
    this.router.delete('/notification/:notificationId', authMiddleware.checkAuthentication, Delete.prototype.notification);

    return this.router;
  }
}

export const notificationRoutes: NotificationRoutes = new NotificationRoutes();
