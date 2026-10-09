import { z } from "zod";
import { TASK_PRIORITIES, TASK_STATUSES } from "../models/Task";
import { dateField } from "./project";

const base = z.object({
  title: z.string().trim().min(2, "Task title must be at least 2 characters").max(120, "Task title is too long"),
  description: z.string().trim().max(1000, "Description must be 1000 characters or fewer").optional(),
  status: z.enum(TASK_STATUSES, { message: "Invalid status" }).optional(),
  priority: z.enum(TASK_PRIORITIES, { message: "Invalid priority" }).optional(),
  dueDate: dateField,
});

export const createTaskSchema = base;
export const updateTaskSchema = base.partial();