import mongoose from "mongoose";

const connectToDB = async () => {
  try {
    await mongoose.connect(String(process.env.MONGODB_URI));
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("Error:", "Error connecting DB", error);
    process.exit(1);
  }
};

export default connectToDB;
