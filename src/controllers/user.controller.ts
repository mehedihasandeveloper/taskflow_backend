import { User, UserDocument } from "../models/User";
import { changePasswordSchema, updateProfileSchema } from "../validators/user";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

const serialize = (user: UserDocument) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  avatar: user.avatar || undefined,
  createdAt: user.createdAt,
});

async function currentUser(userId: unknown, withPassword = false) {
  const query = User.findById(userId);
  const user = await (withPassword ? query.select("+password") : query);
  if (!user) throw new ApiError(401, "User no longer exists");
  return user;
}

export const getMe = asyncHandler(async (_req, res) => {
  res.json({ user: serialize(await currentUser(res.locals.userId)) });
});

export const updateMe = asyncHandler(async (req, res) => {
  const { name, email, avatar } = updateProfileSchema.parse(req.body);
  const user = await currentUser(res.locals.userId);

  if (email && email !== user.email) {
    if (await User.exists({ email, _id: { $ne: user._id } })) {
      throw new ApiError(409, "An account with this email already exists");
    }
    user.email = email;
  }
  if (name) user.name = name;
  if (avatar !== undefined) user.avatar = avatar || undefined; // null or "" removes it

  await user.save();
  res.json({ user: serialize(user) });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
  const user = await currentUser(res.locals.userId, true);

  if (!(await user.comparePassword(currentPassword))) {
    throw new ApiError(400, "Current password is incorrect");
  }
  if (currentPassword === newPassword) {
    throw new ApiError(400, "New password must be different from the current one");
  }

  user.password = newPassword; // hashed by the pre-save hook
  await user.save();
  res.json({ message: "Password updated" });
});