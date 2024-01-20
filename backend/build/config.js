"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const constants_1 = require("./constants");
dotenv_1.default.config({});
class Config {
    constructor() {
        this.DEFAULT_DATABASE_URL = constants_1.MONGO_DATABASE_URL;
        this.DATABASE_USERNAME = process.env.DATABASE_USERNAME || "";
        this.DATABASE_PASSWORD = process.env.DATABASE_PASSWORD || undefined;
        this.DATABASE_URL = constants_1.MONGO_DATABASE_URL;
        this.JWT_TOKEN = process.env.JWT_TOKEN || "BLABLABLA";
        this.NODE_ENV = process.env.NODE_ENV || "";
        this.SECRET_COOKIE_KEY_ONE = process.env.SECRETE_COOKIE_KEY_ONE || "";
        this.SECRET_COOKIE_KEY_TWO = process.env.SECRETE_COOKIE_KEY_TWO || "";
        this.CLIENT_URL = process.env.CLIENT_URL || "";
        this.REDIS_HOST = process.env.REDIS_HOST || "";
    }
    validateConfig() {
        for (const [key, value] of Object.entries(this)) {
            if (value === undefined) {
                throw new Error(`${key} configuration is undefined`);
            }
        }
    }
}
exports.config = new Config();
//# sourceMappingURL=config.js.map