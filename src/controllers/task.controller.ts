import { HydratedDocument, Types } from "mongoose";
import { Project } from "../models/Project";
import { ITask, Task, TASK_PRIORITIES, TASK_STATUSES } from "../models/Task";
import { createTaskSchema, updateTaskSchema } from "../validators/task";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { projectAccess } from "../utils/access";

type Ref = { id: string; name: string; email?: string };
const POPULATE = [
  { path: "assignee", select: "name email" },
  { path: "project", select: "name" },
];

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Turns a populated task document into the shape the frontend uses. */
function serializeTask(doc: HydratedDocument<ITask>) {
  const project = doc.project as unknown as Ref | null;
  const assignee = doc.assignee as unknown as Ref | null;
  return {
    id: doc.id,
    project: project?.id ?? "",
    projectName: project?.name ?? "Unknown project",
    title: doc.title,
    description: doc.description,
    status: doc.status,
    priority: doc.priority,
    dueDate: doc.dueDate,
    assignee: assignee ? { id: assignee.id, name: assignee.name, email: assignee.email ?? "" } : null,
    createdAt: doc.createdAt,
  };
}

async function loadTask(id: unknown) {
  const task = await Task.findById(id).populate(POPULATE);
  if (!task) throw new ApiError(404, "Task not found");
  return serializeTask(task);
}

/** Project the user owns or belongs to (404 otherwise). */
async function findProject(projectId: unknown, userId: unknown, message = "Project not found") {
  const filter: Record<string, unknown> = { _id: projectId, ...projectAccess(userId) };
  const project = await Project.findOne(filter);
  if (!project) throw new ApiError(404, message);
  return project;
}

/** Only the project's owner or members may be assigned a task. */
function assertAssignable(project: { owner: Types.ObjectId; members: Types.ObjectId[] }, assigneeId?: string | null) {
  if (!assigneeId) return;
  const allowed = [project.owner, ...project.members].map(String);
  if (!allowed.includes(assigneeId)) throw new ApiError(400, "Assignee must be a member of this project");
}

// GET /projects/:projectId/tasks
export const getTasks = asyncHandler(async (req, res) => {
  await findProject(req.params.projectId, res.locals.userId);
  const tasks = await Task.find({ project: req.params.projectId }).sort({ createdAt: -1 }).populate(POPULATE);
  res.json({ tasks: tasks.map(serializeTask) });
});

// GET /tasks  - every task from every project the user can access
export const getAllTasks = asyncHandler(async (req, res) => {
  const { search, status, priority, project, assigned, sort } = req.query;
  const projectIds = await Project.find(projectAccess(res.locals.userId)).distinct("_id");

  const filter: Record<string, unknown> = { project: { $in: projectIds } };
  if (typeof project === "string" && project) {
    if (!projectIds.some((id) => String(id) === project)) throw new ApiError(404, "Project not found");
    filter.project = project;
  }
  if (typeof status === "string" && status) {
    if (!TASK_STATUSES.includes(status as (typeof TASK_STATUSES)[number])) throw new ApiError(400, "Invalid status filter");
    filter.status = status;
  }
  if (typeof priority === "string" && priority) {
    if (!TASK_PRIORITIES.includes(priority as (typeof TASK_PRIORITIES)[number])) throw new ApiError(400, "Invalid priority filter");
    filter.priority = priority;
  }
  if (assigned === "me") filter.assignee = res.locals.userId;
  if (typeof search === "string" && search.trim()) {
    const regex = { $regex: escapeRegex(search.trim()), $options: "i" };
    filter.$or = [{ title: regex }, { description: regex }];
  }

  const tasks = await Task.find(filter)
    .sort({ createdAt: sort === "oldest" ? 1 : -1 })
    .limit(500)
    .populate(POPULATE);

  const result = tasks.map(serializeTask);
  if (sort === "due") {
    // earliest due date first, tasks without a due date last
    result.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.getTime() - b.dueDate.getTime();
    });
  }
  res.json({ tasks: result });
});

export const createTask = asyncHandler(async (req, res) => {
  const project = await findProject(req.params.projectId, res.locals.userId);
  const data = createTaskSchema.parse(req.body);
  assertAssignable(project, data.assignee);

  const task = await Task.create({
    ...data,
    assignee: data.assignee ? new Types.ObjectId(data.assignee) : null,
    project: project._id,
    owner: res.locals.userId,
  });
  res.status(201).json({ task: await loadTask(task._id) });
});

export const updateTask = asyncHandler(async (req, res) => {
  const parsed = updateTaskSchema.parse(req.body);
  const data = Object.fromEntries(Object.entries(parsed).filter(([, v]) => v !== undefined));

  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, "Task not found");
  const project = await findProject(task.project, res.locals.userId, "Task not found");
  assertAssignable(project, parsed.assignee);

  task.set(data);
  await task.save();
  res.json({ task: await loadTask(task._id) });
});

export const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, "Task not found");
  await findProject(task.project, res.locals.userId, "Task not found");

  await task.deleteOne();
  res.json({ message: "Task deleted" });
});