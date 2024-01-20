import mongoose from "mongoose";
import Logger from 'bunyan'

import { MONGO_DATABASE_URL  } from "./constants";
import { config } from "@src/config";

const log:Logger = config.createLogger("databaseSetup")

export default () => {
  const connect = () => {
    mongoose
      .connect(MONGO_DATABASE_URL )

      .then(() => {
        log.info("successfully connected to db");
      })
      .catch((error) => {
        log.error("error is ", error);
        return process.exit(1);
      });
  };
  connect();

  mongoose.connection.on("disconnected", connect);
};
