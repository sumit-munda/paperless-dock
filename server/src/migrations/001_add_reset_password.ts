import mongoose from "mongoose";
import connectToDB from "../config/db.js";
import { User } from "../models/userModel.js";

async function runMigration() {
  await connectToDB();

  const result = await User.updateMany(
    { password: { $exists: true } },
    { $set: { passwordNeedsReset: true } }
  );

  console.log("Migration complete:", result.modifiedCount);

  await mongoose.disconnect();
  process.exit(0);
}

runMigration().catch((err) => {
  console.error("Migration failed", err);
  process.exit(1);
});
