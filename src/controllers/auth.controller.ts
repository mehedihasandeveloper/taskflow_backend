import { Request, Response } from "express";
import { User, UserDocument } from "../models/User";
import { loginSchema, registerSchema } from "../validators/auth";
import { ApiError } from "../utils/ApiError";
import { signToken } from "../utils/token";
import { asyncHandler } from "../utils/asyncHandler";

function authResponse(user: UserDocument) {
  return {
    token: signToken(user.id),
    user: { id: user.id, name: user.name, email: user.email },
  };
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = registerSchema.parse(req.body);

  if (await User.exists({ email })) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const user = await User.create({ name, email, password });
  res.status(201).json(authResponse(user));
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await User.findOne({ email }).select("+password");
  // Same message for both cases so attackers can't tell which emails exist
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  res.json(authResponse(user));
});