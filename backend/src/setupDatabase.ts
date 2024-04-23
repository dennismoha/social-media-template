import mongoose from 'mongoose';
import Logger from 'bunyan';


import { config } from '@src/config';
import { redisConnection } from '@src/shared/services/redis/redis.connection';

const log: Logger = config.createLogger('databaseSetup');

export default () => {
  const connect = () => {
    mongoose
      .connect(config.DATABASE_URL ?? '')

      .then(() => {
        log.info('successfully connected to db');
        redisConnection.connect();
      })
      .catch((error) => {
        log.error('error is ', error);
        return process.exit(1);
      });
  };
  connect();

  mongoose.connection.on('disconnected', connect);
};
