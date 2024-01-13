import mongoose from "mongoose";
const pass = "%40$$Mon254";

export default () => {
  const connect = () => {
    mongoose
      .connect(
        `mongodb+srv://georgekinoti254:${encodeURIComponent(
          "@$$Mon254"
        )}@cluster0.v5pwujv.mongodb.net/?retryWrites=true&w=majority`
      )

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
