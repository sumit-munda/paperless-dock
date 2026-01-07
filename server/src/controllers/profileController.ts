import { User } from "../models/userModel.js";
import { AuthRequest } from "../types/types.js";
import { TryCatch } from "../utils/asyncHandler.js";
import { ErrorHandler } from "../utils/errorHandler.js";

export const getMyProfile = TryCatch(async (req: AuthRequest, res, next) => {
  const user = await User.findById(req.user?.id).select(
    "-password -passwordResetToken -passwordResetExpires -__v"
  );

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

export const updateMyProfile = TryCatch(async (req: AuthRequest, res, next) => {
  const allowedUpdates = [
    "name",
    "username",
    "bio",
    "location.city",
    "location.country",
  ];

  const updates: Record<string, any> = {};

  for (const key of allowedUpdates) {
    if (key.includes(".")) {
      const [parent, child] = key.split(".");
      if (req.body[parent]?.[child] !== undefined) {
        updates[`{parent}.${child}`] = req.body[parent][child];
      }
    } else if (req.body[key] !== undefined) {
      updates[key] = req.body[key];
    }
  }

  const user = await User.findByIdAndUpdate(
    req.user?.id,
    { $set: updates },
    { new: true, runValidators: true }
  ).select("-password -passwordResetToken -passwordResetExpires");

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

export const updateProfilePhoto = TryCatch(
  async (req: AuthRequest, res, next) => {
    if (!req.file) {
      throw new ErrorHandler("Profile image is required", 400);
    }

    const avatar = {
      url: req.file.path,
      publicId: req.file.filename,
    };

    const user = await User.findByIdAndUpdate(
      req.user?.id,
      { photo: req.file.path },
      { new: true }
    ).select("-password -passwordResetToken -passwordResetExpires");

    res.status(200).json({
      success: true,
      data: user,
    });
  }
);

export const deleteMyAccount = TryCatch(async (req: AuthRequest, res, next) => {
  await User.findByIdAndUpdate(req.user?.id, {
    isActive: false,
  });

  res.status(200).json({
    success: true,
    message: "Account deactivated successfully",
  });
});
