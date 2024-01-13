import express, {Express} from 'express';

import { ChattyServer } from './setupServer';
import setupDatabase from 'src/setupDatabase';

class Application {
    public initialize(): void{
        setupDatabase()
        const app: Express = express();
        const server:ChattyServer = new ChattyServer(app)
        server.Start()
    }
}

const application:Application = new Application();
application.initialize()