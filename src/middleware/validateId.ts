import { RequestHandler } from "express";
import { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError";

// Rejects malformed MongoDB ids with 400 before they reach the database
export const validateObjectId =
  (param = "id", label = "id"): RequestHandler =>
  (req, _res, next) => {
    if (!isValidObjectId(req.params[param])) return next(new ApiError(400, `Invalid ${label}`));
    next();
  };