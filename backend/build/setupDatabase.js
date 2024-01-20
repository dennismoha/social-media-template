"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const constants_1 = require("./constants");
exports.default = () => {
    const connect = () => {
        mongoose_1.default
            .connect(constants_1.MONGO_DATABASE_URL)
            .then(() => {
            console.log("successfully connected to db");
        })
            .catch((error) => {
            console.log("error is ", error);
            return process.exit(1);
        });
    };
    connect();
    mongoose_1.default.connection.on("disconnected", connect);
};
//# sourceMappingURL=setupDatabase.js.map