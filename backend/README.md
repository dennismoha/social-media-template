# Logger
* this branch dealt with configuration of the logger middleware. We used bunyan and replaced console.logs
* in order for Bunyan to have some nice well formatted logs we had to configure it on our package.json script command.
```  "dev": "nodemon -r tsconfig-paths/register src/app.ts | bunyan"```
* we configured bunyan on our config file 
* using that configuration on every file, on each file give bunyan a different name for that file and you are good to go.
* for example:
     ``` 
                    import Logger from 'bunyan'
                    import { config } from "@src/config";

                    const log:Logger = config.createLogger("databaseSetup") ; // logger name
    ```
* check the database setup for how it's used to log for different levels