import { z } from "zod";

const passwordRule = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Za-z]/, "Use at least one letter and one number")
  .regex(/\d/, "Use at least one letter and one number");

// Avatars are small resized images sent as data URLs (about 20-40 KB). null removes the avatar.
const avatarRule = z
  .union([z.string(), z.null()])
  .refine((v) => v === null || v === "" || /^data:image\/(png|jpeg|webp);base64,/.test(v), "Avatar must be a PNG, JPEG or WebP image")
  .refine((v) => v === null || v.length <= 300_000, "Avatar image is too large");

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(50, "Name is too long").optional(),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address").toLowerCase().optional(),
  avatar: avatarRule.optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordRule,
});