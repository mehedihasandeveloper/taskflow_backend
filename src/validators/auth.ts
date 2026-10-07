import { z } from "zod";

const email = z.string().trim().min(1, "Email is required").email("Enter a valid email address");

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(50),
  email,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Za-z]/, "Use at least one letter and one number")
    .regex(/\d/, "Use at least one letter and one number"),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});