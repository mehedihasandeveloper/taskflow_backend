import { User } from "../models/User";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

export const getMe = asyncHandler(async (_req, res) => {
  const user = await User.findById(res.locals.userId);
  if (!user) throw new ApiError(401, "User no longer exists");

  res.json({
    user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar, createdAt: user.createdAt },
  });
});