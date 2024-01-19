import mongoose from "mongoose";


import { MONGO_DATABASE_URL  } from "./constants";


export default () => {
  const connect = () => {
    mongoose
      .connect(MONGO_DATABASE_URL )

      .then(() => {
        console.log("successfully connected to db");
      })
      .catch((error) => {
        console.log("error is ", error);
        return process.exit(1);
      });
  };
  connect();

  mongoose.connection.on("disconnected", connect);
};
