import { Schema, model, Types } from "mongoose";

export const TASK_STATUSES = ["Todo", "In Progress", "Completed"] as const;
export const TASK_PRIORITIES = ["Low", "Medium", "High"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export interface ITask {
  project: Types.ObjectId;
  owner: Types.ObjectId;
  assignee: Types.ObjectId | null;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    assignee: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    title: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000, default: "" },
    status: { type: String, enum: TASK_STATUSES, default: "Todo" },
    priority: { type: String, enum: TASK_PRIORITIES, default: "Medium" },
    dueDate: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

export const Task = model<ITask>("Task", taskSchema);