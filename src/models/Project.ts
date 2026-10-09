import { Schema, model, Types } from "mongoose";

export const PROJECT_STATUSES = ["Planning", "In Progress", "Completed", "Archived"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export interface IProject {
  owner: Types.ObjectId;
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: Date | null;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 500, default: "" },
    status: { type: String, enum: PROJECT_STATUSES, default: "Planning" },
    startDate: { type: Date, default: null },
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

export const Project = model<IProject>("Project", projectSchema);