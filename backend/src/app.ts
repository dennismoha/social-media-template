import express, { Express } from 'express';
import { config } from './config';
import Logger from 'bunyan';

import { ChattyServer } from './setupServer';
import setupDatabase from './setupDatabase';

const log: Logger = config.createLogger('app');

class Application {
  public initialize(): void {
    this.loadConfig();
    setupDatabase();
    const app: Express = express();
    const server: ChattyServer = new ChattyServer(app);
    server.Start();
    Application.handleExecptions();
  }

  private loadConfig(): void {
    config.validateConfig();
    config.cloudinaryConfig();
  }

  // catch exceptions
  private static handleExecptions(): void {
    process.on('uncaughtException', (error: Error) => {
      log.error(`uncaught error occured ${error}`);
      Application.shutdownProperly(1);
    });

    // incase of an error not well handled
    process.on('unhandleRejection', (rejection: Error) => {
      log.error(`unHandled rejection occured ${rejection}`);
      Application.shutdownProperly(2);
    });

    // signal to terminate a process
    process.on('SIGTERM', () => {
      log.error('caught sigterm');
      Application.shutdownProperly(2);
    });

    // signal to terminate a process
    process.on('exit', () => {
      log.error('Exiting');
      Application.shutdownProperly(2);
    });
  }

  private static shutdownProperly(exitCode: number): void {
    Promise.resolve()
      .then(() => {
        log.info('shutdown complete');
        process.exit(exitCode);
      })
      .catch((error) => {
        log.error(`Error when server shutting down ${error}`);
        process.exit(1);
      });
  }
}

const application: Application = new Application();
application.initialize();
