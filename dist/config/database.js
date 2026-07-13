import mongoose from "mongoose";
import { env } from "./env.js";
import { logInfo } from "../utils/logger.js";
export async function connectDatabase() {
    mongoose.set("strictQuery", true);
    await mongoose.connect(env.mongoUri);
    logInfo("MongoDB connected");
}
