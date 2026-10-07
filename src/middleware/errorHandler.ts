import { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { Error as MongooseError } from "mongoose";
import { ApiError } from "../utils/ApiError";

export const notFound: RequestHandler = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ message: err.message });
  }
  if (err instanceof ZodError) {
    const errors: Record<string, string> = {};
    err.issues.forEach((i) => { errors[i.path.join(".")] ??= i.message; });
    return res.status(400).json({ message: err.issues[0].message, errors });
  }
  if (err instanceof MongooseError.CastError) {
    return res.status(400).json({ message: `Invalid ${err.path}` });
  }
  if (err?.code === 11000) {
    return res.status(409).json({ message: "An account with this email already exists" });
  }
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON body" });
  }
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
};