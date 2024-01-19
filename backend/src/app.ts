import express, {Express} from 'express';
import { config } from './config';

import { ChattyServer } from './setupServer';
import setupDatabase from './setupDatabase';

class Application {
    public initialize(): void{
        this.loadConfig()
        setupDatabase()
        const app: Express = express();
        const server:ChattyServer = new ChattyServer(app)
        server.Start()
    }

    private loadConfig(): void {
        config.validateConfig();
    }
}

const application:Application = new Application();
application.initialize()