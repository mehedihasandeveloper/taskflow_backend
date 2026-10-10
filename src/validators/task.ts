import { z } from "zod";
import { isValidObjectId } from "mongoose";
import { TASK_PRIORITIES, TASK_STATUSES } from "../models/Task";
import { dateField } from "./project";

// "" or null = unassigned; otherwise a valid user id
const assigneeField = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value, ctx) => {
    if (value === undefined) return undefined;
    if (!value) return null;
    if (!isValidObjectId(value)) {
      ctx.addIssue({ code: "custom", message: "Invalid assignee" });
      return z.NEVER;
    }
    return value;
  });

const base = z.object({
  title: z.string().trim().min(2, "Task title must be at least 2 characters").max(120, "Task title is too long"),
  description: z.string().trim().max(1000, "Description must be 1000 characters or fewer").optional(),
  status: z.enum(TASK_STATUSES, { message: "Invalid status" }).optional(),
  priority: z.enum(TASK_PRIORITIES, { message: "Invalid priority" }).optional(),
  dueDate: dateField,
  assignee: assigneeField,
});

export const createTaskSchema = base;
export const updateTaskSchema = base.partial();