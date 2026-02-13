import mongoose from "mongoose";

const connectToDB = async () => {
  try {
    const MONGO_URI = process.env.MONGODB_URI;
    if (!MONGO_URI) throw new Error("MONGODB_URI missing");

    await mongoose.connect(String(process.env.MONGODB_URI));
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("Error:", "Error connecting DB", error);
    process.exit(1);
  }
};

export default connectToDB;
