import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

// Verifies the "Authorization: Bearer <token>" header and stores the user id in res.locals.userId
export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) throw new ApiError(401, "Not authenticated");

  try {
    const payload = jwt.verify(header.slice(7), env.jwtSecret) as { id: string };
    res.locals.userId = payload.id;
  } catch {
    throw new ApiError(401, "Invalid or expired token");
  }
  next();
});