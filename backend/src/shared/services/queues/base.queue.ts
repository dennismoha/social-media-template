import Queue, { Job } from 'bull';

import Logger from 'bunyan';

import {createBullBoard} from '@bull-board/api';
import {BullAdapter} from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
//import { ExpressAdapter } from '@bull-board/express';
import { config } from '@src/config';
import { IAuthJob } from '@src/interfaces/auth.interface';

type IBaseJobData =
  |  IAuthJob

let bullAdapters: BullAdapter[] = [];
export let serverAdapter = new ExpressAdapter();

export abstract class BaseQueue {
  queue: Queue.Queue;
  log: Logger;

  constructor(queuename: string){
    this.queue = new Queue(queuename, `${config.REDIS_HOST}`);
    bullAdapters.push(new BullAdapter(this.queue));
    // removes duplicate queue
    bullAdapters=[...new Set(bullAdapters)];

    serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/queues');

    createBullBoard({
      queues: bullAdapters,
      serverAdapter
    });

    this.log = config.createLogger(`${queuename}Queue`);

    // que events
    this.queue.on('completed', (job:Job )=>{
      job.remove();
    });
    this.queue.on('global:completed', (jobId:string )=>{
      this.log.info(`Job ${jobId} completed`);
    });
    this.queue.on('global:stalled', (jobId:string )=>{
      this.log.info(`Job ${jobId} stalled`);
    });
  }

  // adding a job to a queue
  protected addJob(name: string, data: IBaseJobData): void{
    // wait for 5 seconds before the job is retried
    this.queue.add(name, data, {attempts: 3, backoff:{type:'fixed', delay:5000}});
  }

  //process jobs inside a queue
  // concurrency limits the number of jobs to be processed per instance
  protected processJob(name: string, concurrency: number, callback: Queue.ProcessCallbackFunction<void>):  void {
    this.queue.process(name, concurrency, callback);
  }
}
