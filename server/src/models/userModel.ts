import mongoose from "mongoose";
import { IUser } from "../types/types.js";
import {
  generateFirebaseLikeId,
  generatePhotoFromInitials,
  generateUsernameFromEmail,
} from "../utils/utils.js";
import validator from "validator";

const userSchema = new mongoose.Schema<IUser>(
  {
    _id: {
      type: String,
      default: () => generateFirebaseLikeId(),
    },
    name: {
      type: String,
      default: "",
      trim: true,
    },
    username: {
      type: String,
      default: function (this: { email: string }) {
        return generateUsernameFromEmail(this.email);
      },
    },
    bio: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      required: [true, "Please enter email"],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail],
    },
    password: {
      type: String,
      required: function (this: any) {
        return this.provider === "credentials";
      },
      select: false,
    },
    passwordNeedsReset: {
      type: Boolean,
      default: false,
    },
    passwordResetToken: { type: String },
    passwordResetExpires: {
      type: Date,
    },
    provider: {
      type: String,
      enum: ["credentials", "google"],
      default: "credentials",
    },
    googleId: {
      type: String,
      sparse: true,
    },
    photo: {
      type: String,
      default: function (this: { username?: string }) {
        return generatePhotoFromInitials(this.username);
      },
    },
    role: {
      type: String,
      enum: ["admin", "user", "seller"],
      default: "user",
    },
    subscription: {
      status: {
        type: String,
        enum: ["inactive", "active", "cancelled"],
        default: "inactive",
      },
      stripeCustomerId: {
        type: String,
        default: "",
      },
    },
    location: {
      city: { type: String, default: "" },
      country: { type: String, default: "" },
    },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    emailVerified: { type: Boolean, default: false },
    settings: {
      theme: { type: String, default: "light" },
      language: {
        type: String,
        enum: ["en", "hi"],
        default: "en",
      },
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>("user", userSchema);

// One-time DB migration
