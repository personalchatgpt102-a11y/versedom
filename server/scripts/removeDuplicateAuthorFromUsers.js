import dotenv from "dotenv";
import mongoose from "mongoose";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import User from "../models/User.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config({
  path: resolve(__dirname, "../.env"),
});

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected:", mongoose.connection.name);

    const result = await User.updateMany(
      {
        author: { $exists: true },
      },
      {
        $unset: {
          author: "",
        },
      }
    );

    console.log("Duplicate user author field removed");
    console.log("Users matched:", result.matchedCount);
    console.log("Users updated:", result.modifiedCount);

    const testUser = await User.findOne({
      email: "goldenbutterfly890@gmail.com",
    }).lean();

    console.log("Test user authorProfile:");
    console.log(testUser?.authorProfile);

    console.log("Old duplicate author field:");
    console.log(testUser?.author);

    await mongoose.disconnect();

    process.exit(0);
  } catch (error) {
    console.error("Cleanup failed:");
    console.error(error);

    process.exit(1);
  }
};

run();