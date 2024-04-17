import { IErrorResponse } from '@src/interfaces/error-handler-interfaces';
import { Application, json, urlencoded, Response, Request, NextFunction } from 'express';
import http from 'http';

import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import cookieSession from 'cookie-session';
import HTTP_STATUS from 'http-status-codes';
import { Server } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import 'express-async-errors';
import compression from 'compression';
import { config } from './config';
import applicationRoutes from './routes';
import { CustomError } from '@src/shared/globals/helpers/error-handler';
import Logger from 'bunyan';
import { SocketIOPostHandler } from '@src/shared/sockets/posts';
import { SocketIOFollowerHandler } from '@src/shared/sockets/follower';
import { SocketIOUserHandler } from '@src/shared/sockets/user';
import { SocketIONotificationHandler } from '@src/shared/sockets/notification';
import { SocketIOImageHandler } from '@src/shared/sockets/image';
import { SocketIOChatHandler } from '@src/shared/sockets/chat';

const log: Logger = config.createLogger('server');
const SERVER_PORT = 8000;

export class ChattyServer {
  private app: Application;

  constructor(app: Application) {
    this.app = app;
  }

  public Start(): void {
    this.securityMiddleware(this.app);
    this.standardMiddleware(this.app);
    this.routeMiddleware(this.app);
    this.globalErrorHandler(this.app);
    this.startServer(this.app);
  }

  private securityMiddleware(app: Application): void {
    app.use(
      cookieSession({
        name: 'session',
        keys: [config.SECRET_COOKIE_KEY_ONE!, config.SECRET_COOKIE_KEY_TWO!],
        maxAge: 24 * 7 * 3600000,
       secure: config.NODE_ENV !== 'development'
      })
    );
    app.use(hpp());
    app.use(helmet());
    app.use(
      cors({
        origin: '*',
        credentials: true,
        optionsSuccessStatus: 200,
        methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS']
      })
    );
  }

  private standardMiddleware(app: Application): void {
    app.use(compression());
    app.use(json({ limit: '50mb' }));
    app.use(urlencoded({ extended: true, limit: '50mb' }));
  }
  private routeMiddleware(app: Application): void {
    applicationRoutes(app);
  }

  private globalErrorHandler(app: Application): void {
    log.error('in the global error handler');
    app.use('*', (req: Request, res: Response) => {
      log.error('in * global error handler');
      return res.status(HTTP_STATUS.NOT_FOUND).json({ message: `${req.originalUrl} not found` });
    });

    app.use((error: IErrorResponse, _req: Request, res: Response, next: NextFunction) => {
      log.error('in error section of the global error handler ', error);
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json(error.serializeErrors());
      }
      next();
    });
  }

  // creating http server
  private async startServer(app: Application): Promise<void> {
    if(!config.JWT_TOKEN) {
      throw new Error('token must be provided')
    }
    try {
      const httpServer: http.Server = new http.Server(app);
      const socketIO: Server = await this.createSocketIO(httpServer);
      this.startHttpServer(httpServer);
      this.socketIOConnections(socketIO);
    } catch (error) {
      console.log('error is ', error);
    }
  }

  //socket io redis adapter setup configuration
  private async createSocketIO(httpServer: http.Server): Promise<Server> {
    const io: Server = new Server(httpServer, {
      cors: {
        origin: config.CLIENT_URL,
        methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS']
      }
    });

    const pubClient = createClient({ url: config.REDIS_HOST });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    io.listen(3000);

    return io;
  }

  // calling the listen method
  private startHttpServer(httpServer: http.Server): void {
    log.info(`worker with process id of ${process.pid} has started`);
    log.info(`server has started  with process id of ${process.pid} has started`);
    httpServer.listen(SERVER_PORT, () => {
      log.info('server running ', SERVER_PORT);
    });
  }

  // all socket io connections will be defined here

  private socketIOConnections(io: Server): void {
    log.info('io is');
    const postSocketHandler: SocketIOPostHandler = new SocketIOPostHandler(io);
    const followerSocketHandler: SocketIOFollowerHandler = new SocketIOFollowerHandler(io);
    const userSocketHandler: SocketIOUserHandler = new  SocketIOUserHandler (io);
    const socketIONotificationHandler: SocketIONotificationHandler = new  SocketIONotificationHandler ();
    const socketIOImageHandler: SocketIOImageHandler = new  SocketIOImageHandler();
    const socketIOChatHandler: SocketIOChatHandler = new  SocketIOChatHandler(io);
    postSocketHandler.listen();
    followerSocketHandler.listen();
    userSocketHandler.listen();
    socketIOChatHandler.listen();
    socketIONotificationHandler.listen(io);
    socketIOImageHandler.listen(io);

  }
}
