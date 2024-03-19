import { DELETE_NOTIFICATION, UPDATE_NOTIFICATION } from '@src/constants';
import { INotificationJobData } from '@src/features/notifications/interfaces/notification.interface';
import { BaseQueue } from '@src/shared/services/queues/base.queue';
import { notificationWorker } from '@src/shared/workers/notification.worker';

class NotificationQueue extends BaseQueue {
  constructor() {
    super('notifications');
    this.processJob(UPDATE_NOTIFICATION, 5, notificationWorker.updateNotification);
    this.processJob(DELETE_NOTIFICATION, 5, notificationWorker.deleteNotification);
  }

  public addNotificationJob(name: string, data: INotificationJobData): void {
    this.addJob(name, data);
  }
}

export const notificationQueue: NotificationQueue = new NotificationQueue();
