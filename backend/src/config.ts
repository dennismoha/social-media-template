import dotenv from 'dotenv';
import { MONGO_DATABASE_URL } from './constants';
import bunyan from 'bunyan';

dotenv.config({});

class Config {
  public DATABASE_URL: string | undefined;
  public DATABASE_USERNAME: string | undefined;
  public DATABASE_PASSWORD: string | undefined;
  public JWT_TOKEN: string | undefined;
  public NODE_ENV: string | undefined;
  public SECRET_COOKIE_KEY_ONE: string | undefined;
  public SECRET_COOKIE_KEY_TWO: string | undefined;
  public CLIENT_URL: string | undefined;
  public REDIS_HOST: string | undefined;

  private readonly DEFAULT_DATABASE_URL = MONGO_DATABASE_URL;

  constructor() {
    this.DATABASE_USERNAME = process.env.DATABASE_USERNAME || '';
    this.DATABASE_PASSWORD = process.env.DATABASE_PASSWORD || undefined;
    this.DATABASE_URL = MONGO_DATABASE_URL;
    this.JWT_TOKEN = process.env.JWT_TOKEN || 'BLABLABLA';
    this.NODE_ENV = process.env.NODE_ENV || '';
    this.SECRET_COOKIE_KEY_ONE = process.env.SECRETE_COOKIE_KEY_ONE || '';
    this.SECRET_COOKIE_KEY_TWO = process.env.SECRETE_COOKIE_KEY_TWO || '';
    this.CLIENT_URL = process.env.CLIENT_URL || '';
    this.REDIS_HOST = process.env.REDIS_HOST || '';
  }

  public createLogger(name: string): bunyan {
    return bunyan.createLogger({ name, level: 'debug' });
  }

  public validateConfig(): void {
    for (const [key, value] of Object.entries(this)) {
      if (value === undefined) {
        throw new Error(`${key} configuration is undefined`);
      }
    }
  }
}

export const config: Config = new Config();
