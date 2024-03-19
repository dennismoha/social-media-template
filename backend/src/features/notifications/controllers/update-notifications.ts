
import { UPDATE_NOTIFICATION } from '@src/constants';
import { notificationQueue } from '@src/shared/services/queues/notification.queue';
import { socketIONotificationObject } from '@src/shared/sockets/notification';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

export class Update {
  public async notification(req: Request, res: Response): Promise<void> {
    const { notificationId } = req.params;

    socketIONotificationObject.emit('update notification', notificationId);
    notificationQueue.addNotificationJob(UPDATE_NOTIFICATION, { key: notificationId });
    res.status(HTTP_STATUS.OK).json({ message: 'Notification marked as read' });
  }
}
