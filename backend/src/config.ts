import dotenv from 'dotenv';
import bunyan from 'bunyan';
import cloudinary from 'cloudinary';

dotenv.config({});

class Config {
  public DATABASE_URL: string | undefined;
  public DATABASE_USERNAME: string | undefined;
  public DATABASE_PASSWORD: string |  undefined ;
  public JWT_TOKEN: string;
  public NODE_ENV: string | undefined;
  public SECRET_COOKIE_KEY_ONE: string | undefined;
  public SECRET_COOKIE_KEY_TWO: string | undefined;
  public CLIENT_URL: string | undefined;
  public REDIS_HOST: string | undefined;
  public CLOUD_NAME: string | undefined;
  public CLOUD_API_KEY: string | undefined;
  public CLOUD_API_SECRET: string | undefined;
  public SENDER_EMAIL: string | undefined;
  public SENDER_EMAIL_PASSWORD: string | undefined;
  public SENDGRID_API_KEY: string | undefined;
  public SENDGRID_SENDER: string | undefined;
  public EC2_URL: string | undefined;


  constructor() {
    this.DATABASE_USERNAME = process.env.DATABASE_USERNAME || '';
    this.DATABASE_PASSWORD = process.env.DATABASE_PASSWORD || undefined;
    this.DATABASE_URL = `mongodb+srv://${process.env.DATABASE_USERNAME}:${encodeURIComponent(
      process.env.DATABASE_PASSWORD ?? ''
    )}@cluster0.v5pwujv.mongodb.net/?retryWrites=true&w=majority`;
    ;
    this.JWT_TOKEN = process.env.JWT_TOKEN || 'BLABLABLA';
    this.NODE_ENV = process.env.NODE_ENV || '';
    this.SECRET_COOKIE_KEY_ONE = process.env.SECRETE_COOKIE_KEY_ONE || '';
    this.SECRET_COOKIE_KEY_TWO = process.env.SECRETE_COOKIE_KEY_TWO || '';
    this.CLIENT_URL = process.env.CLIENT_URL || '';
    this.REDIS_HOST = process.env.REDIS_HOST || '';
    this.CLOUD_NAME = process.env.CLOUD_NAME;
    this.CLOUD_API_KEY = process.env.CLOUD_API_KEY;
    this.CLOUD_API_SECRET = process.env.CLOUD_API_SECRET;
    this.SENDER_EMAIL = process.env.SENDER_EMAIL;
    this.SENDER_EMAIL_PASSWORD = process.env.SENDER_EMAIL_PASSWORD;
    this.SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    this.SENDGRID_SENDER = process.env.SENDGRID_SENDER;
    this.EC2_URL = process.env.EC2_URL;
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

  public cloudinaryConfig(): void {
    cloudinary.v2.config({
      cloud_name: this.CLOUD_NAME,
      api_key: this.CLOUD_API_KEY,
      api_secret: this.CLOUD_API_SECRET
    });
  }
}

export const config: Config = new Config();
