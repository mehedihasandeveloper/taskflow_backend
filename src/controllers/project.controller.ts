import { HydratedDocument } from "mongoose";
import { IProject, Project, PROJECT_STATUSES, ProjectStatus } from "../models/Project";
import { Task } from "../models/Task";
import { User } from "../models/User";
import { addMemberSchema, createProjectSchema, updateProjectSchema } from "../validators/project";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { projectAccess } from "../utils/access";
import { publicUser, UserLike } from "../utils/serialize";

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const SORTS: Record<string, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  name: { name: 1 },
  due: { dueDate: 1 },
};

const isOwner = (project: HydratedDocument<IProject>, userId: unknown) => String(project.owner) === String(userId);

const serialize = (project: HydratedDocument<IProject>, userId: unknown) => ({
  ...project.toJSON(),
  role: isOwner(project, userId) ? "owner" : "member",
});

/** Finds a project the user owns or belongs to; 404 otherwise (never reveals other users' projects). */
async function findAccessible(id: string, userId: unknown) {
  const filter: Record<string, unknown> = { _id: id, ...projectAccess(userId) };
  const project = await Project.findOne(filter);
  if (!project) throw new ApiError(404, "Project not found");
  return project;
}

async function findOwned(id: string, userId: unknown) {
  const project = await findAccessible(id, userId);
  if (!isOwner(project, userId)) throw new ApiError(403, "Only the project owner can do that");
  return project;
}

export const getProjects = asyncHandler(async (req, res) => {
  const { search, status, sort } = req.query;
  const and: Record<string, unknown>[] = [projectAccess(res.locals.userId)];

  if (typeof search === "string" && search.trim()) {
    const regex = { $regex: escapeRegex(search.trim()), $options: "i" };
    and.push({ $or: [{ name: regex }, { description: regex }] });
  }
  if (typeof status === "string" && status) {
    if (!PROJECT_STATUSES.includes(status as ProjectStatus)) throw new ApiError(400, "Invalid status filter");
    and.push({ status });
  }

  const sortBy = SORTS[typeof sort === "string" ? sort : "newest"] ?? SORTS.newest;
  const projects = await Project.find({ $and: and }).sort(sortBy).collation({ locale: "en" });
  res.json({ projects: projects.map((p) => serialize(p, res.locals.userId)) });
});

export const getProject = asyncHandler(async (req, res) => {
  const project = await findAccessible(req.params.id, res.locals.userId);
  res.json({ project: serialize(project, res.locals.userId) });
});

export const createProject = asyncHandler(async (req, res) => {
  const data = createProjectSchema.parse(req.body);
  const project = await Project.create({ ...data, owner: res.locals.userId });
  res.status(201).json({ project: serialize(project, res.locals.userId) });
});

export const updateProject = asyncHandler(async (req, res) => {
  const parsed = updateProjectSchema.parse(req.body);
  const data = Object.fromEntries(Object.entries(parsed).filter(([, v]) => v !== undefined));

  const project = await findOwned(req.params.id, res.locals.userId);
  project.set(data);
  await project.save();
  res.json({ project: serialize(project, res.locals.userId) });
});

export const deleteProject = asyncHandler(async (req, res) => {
  const project = await findOwned(req.params.id, res.locals.userId);
  await Task.deleteMany({ project: project._id }); // remove the project's tasks too
  await project.deleteOne();
  res.json({ message: "Project deleted" });
});

// ---------- Members ----------

export const getMembers = asyncHandler(async (req, res) => {
  const project = await findAccessible(req.params.id, res.locals.userId);
  await project.populate([
    { path: "owner", select: "name email avatar" },
    { path: "members", select: "name email avatar" },
  ]);
  res.json({
    owner: publicUser(project.owner as unknown as UserLike),
    members: (project.members as unknown as UserLike[]).map(publicUser),
  });
});

export const addMember = asyncHandler(async (req, res) => {
  const { email } = addMemberSchema.parse(req.body);
  const project = await findOwned(req.params.id, res.locals.userId);

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "No account found with that email. They need to sign up first.");
  if (String(user._id) === String(project.owner)) throw new ApiError(400, "That person already owns this project");
  if (project.members.some((m) => String(m) === String(user._id))) {
    throw new ApiError(409, "That person is already a member of this project");
  }

  project.members.push(user._id);
  await project.save();
  res.status(201).json({ member: publicUser(user) });
});

export const removeMember = asyncHandler(async (req, res) => {
  const project = await findOwned(req.params.id, res.locals.userId);
  const { userId } = req.params;

  if (!project.members.some((m) => String(m) === userId)) throw new ApiError(404, "That person is not a member of this project");

  project.members = project.members.filter((m) => String(m) !== userId) as typeof project.members;
  await project.save();
  await Task.updateMany({ project: project._id, assignee: userId }, { assignee: null }); // unassign their tasks
  res.json({ message: "Member removed" });
});