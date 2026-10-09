import { Project, PROJECT_STATUSES, ProjectStatus } from "../models/Project";
import { Task } from "../models/Task";
import { createProjectSchema, updateProjectSchema } from "../validators/project";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const SORTS: Record<string, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  name: { name: 1 },
  due: { dueDate: 1 },
};

// Every query includes the owner, so users can only ever touch their own projects
const ownedBy = (res: { locals: Record<string, unknown> }, id?: string): Record<string, unknown> => ({
  ...(id ? { _id: id } : {}),
  owner: res.locals.userId,
});

export const getProjects = asyncHandler(async (req, res) => {
  const { search, status, sort } = req.query;
  const filter: Record<string, unknown> = ownedBy(res);

  if (typeof search === "string" && search.trim()) {
    const regex = { $regex: escapeRegex(search.trim()), $options: "i" };
    filter.$or = [{ name: regex }, { description: regex }];
  }
  if (typeof status === "string" && status) {
    if (!PROJECT_STATUSES.includes(status as ProjectStatus)) throw new ApiError(400, "Invalid status filter");
    filter.status = status;
  }

  const sortBy = SORTS[typeof sort === "string" ? sort : "newest"] ?? SORTS.newest;
  const projects = await Project.find(filter).sort(sortBy).collation({ locale: "en" });
  res.json({ projects });
});

export const getProject = asyncHandler(async (req, res) => {
  const project = await Project.findOne(ownedBy(res, req.params.id));
  if (!project) throw new ApiError(404, "Project not found");
  res.json({ project });
});

export const createProject = asyncHandler(async (req, res) => {
  const data = createProjectSchema.parse(req.body);
  const project = await Project.create({ ...data, owner: res.locals.userId });
  res.status(201).json({ project });
});

export const updateProject = asyncHandler(async (req, res) => {
  const parsed = updateProjectSchema.parse(req.body);
  const data = Object.fromEntries(Object.entries(parsed).filter(([, v]) => v !== undefined));

  const project = await Project.findOneAndUpdate(ownedBy(res, req.params.id), data, {
    new: true,
    runValidators: true,
  });
  if (!project) throw new ApiError(404, "Project not found");
  res.json({ project });
});

export const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findOneAndDelete(ownedBy(res, req.params.id));
  if (!project) throw new ApiError(404, "Project not found");
  await Task.deleteMany({ project: project._id }); // remove the project's tasks too
  res.json({ message: "Project deleted" });
});