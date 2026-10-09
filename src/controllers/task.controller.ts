import { Project } from "../models/Project";
import { Task } from "../models/Task";
import { createTaskSchema, updateTaskSchema } from "../validators/task";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

// Confirms the project exists AND belongs to the logged-in user
async function assertProjectOwned(projectId: string, userId: unknown) {
  const filter: Record<string, unknown> = { _id: projectId, owner: userId };
  if (!(await Project.exists(filter))) throw new ApiError(404, "Project not found");
}

export const getTasks = asyncHandler(async (req, res) => {
  await assertProjectOwned(req.params.projectId, res.locals.userId);
  const tasks = await Task.find({ project: req.params.projectId, owner: res.locals.userId }).sort({ createdAt: -1 });
  res.json({ tasks });
});

export const createTask = asyncHandler(async (req, res) => {
  await assertProjectOwned(req.params.projectId, res.locals.userId);
  const data = createTaskSchema.parse(req.body);
  const task = await Task.create({ ...data, project: req.params.projectId, owner: res.locals.userId });
  res.status(201).json({ task });
});

export const updateTask = asyncHandler(async (req, res) => {
  const parsed = updateTaskSchema.parse(req.body);
  const data = Object.fromEntries(Object.entries(parsed).filter(([, v]) => v !== undefined));

  const task = await Task.findOneAndUpdate({ _id: req.params.id, owner: res.locals.userId }, data, {
    new: true,
    runValidators: true,
  });
  if (!task) throw new ApiError(404, "Task not found");
  res.json({ task });
});

export const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, owner: res.locals.userId });
  if (!task) throw new ApiError(404, "Task not found");
  res.json({ message: "Task deleted" });
});