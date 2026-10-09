import { z } from "zod";
import { PROJECT_STATUSES } from "../models/Project";

// Accepts "YYYY-MM-DD", "" or null (both mean "no date"), returns Date | null
export const dateField = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value, ctx) => {
    if (value === undefined) return undefined;
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      ctx.addIssue({ code: "custom", message: "Invalid date" });
      return z.NEVER;
    }
    return date;
  });

const base = z.object({
  name: z.string().trim().min(2, "Project name must be at least 2 characters").max(100, "Project name is too long"),
  description: z.string().trim().max(500, "Description must be 500 characters or fewer").optional(),
  status: z.enum(PROJECT_STATUSES, { message: "Invalid status" }).optional(),
  startDate: dateField,
  dueDate: dateField,
});

const datesInOrder = {
  check: (d: { startDate?: Date | null; dueDate?: Date | null }) => !d.startDate || !d.dueDate || d.dueDate >= d.startDate,
  options: { message: "Due date cannot be before the start date", path: ["dueDate"] },
};

export const createProjectSchema = base.refine(datesInOrder.check, datesInOrder.options);
export const updateProjectSchema = base.partial().refine(datesInOrder.check, datesInOrder.options);