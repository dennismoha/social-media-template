import express, { Router, Request, Response } from 'express';
import moment from 'moment';
import axios from 'axios';
import { performance } from 'perf_hooks'; // this is directly from core nodejs module
import HTTP_STATUS from 'http-status-codes';
import { config } from '@src/config';
// import { config } from '@root/config';


/*
  These routes are used to check the health of the server.
  each will return different status code if called

*/

class HealthRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  // returns 200 to check if the server is up or not
  public health(): Router {
    this.router.get('/health', (req: Request, res: Response) => {
      res.status(HTTP_STATUS.OK).send(`HEALTH: SERVER INSTANCE IS HEALTH WITH PROCESS ID  ${process.pid} on ${moment().format('LL')} `);
    });
    return this.router;
  }

  //displays the environment the server is in. either  development or production
  public env(): Router {
    this.router.get('/env', (req: Request, res: Response) => {
      res.status(HTTP_STATUS.OK).send(`THIS IS THE  ${config.NODE_ENV} ENVIRONMENT `);
    });
    return this.router;
  }

  //returns the instance id of the server since the application will be running on ec2
  public instance(): Router {
    this.router.get('/instance', async (req: Request, res: Response) => {
      const response = await axios({
        method: 'get',
        url: config.EC2_URL
      });
      res
        .status(HTTP_STATUS.OK)
        .send(`SERVER IS RUNNING ON EC2 INSTANCE WITH ID${response.data} and process id ${process.pid} on ${moment().format('LL')} `);
    });
    return this.router;
  }

  public fiboRoutes(): Router {
    this.router.get('/fibo/:num', async (req: Request, res: Response) => {
      const { num } = req.params;
      const start: number = performance.now();
      const result: number = this.fibo(parseInt(num, 10));
      const end: number = performance.now();
      // const response = await axios({
      //   method: 'get',
      //   url: config.EC2_URL
      // });
      // res.status(HTTP_STATUS.OK).send(
      //   `Fibonacci series of ${num} is ${result} and it took ${end - start}ms with EC2 instance of ${
      //     response.data
      //   } and process id ${process.pid} on ${moment().format('LL')}`
      // );

      res
        .status(HTTP_STATUS.OK)
        .send(
          `Fibonacci series of ${num} is ${result} and it took ${end - start}ms with process id ${process.pid} on ${moment().format('LL')}`
        );
    });

    return this.router;
  }

  /*
    this is just a function to put heavy load on the server to test it's capabilites.
    It's not a well optimized fibonnacci function
    NB: for small numbers this function works fine unlike for bigger numbers
    it is going to put a lot of load on the cpu for bigger numbers.
  */
  private fibo(data: number): number {
    if (data < 2) {
      return 1;
    } else {
      return this.fibo(data - 2) + this.fibo(data - 1);
    }
  }


}

export const healthRoutes: HealthRoutes = new HealthRoutes();
