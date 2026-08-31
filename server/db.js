import "dotenv/config";
import mongoose from "mongoose";

mongoose.set("strictQuery", true);

export async function connectDb() {
  await mongoose.connect(process.env.MONGO_URL);
  return mongoose.connection;
}

export default mongoose;
