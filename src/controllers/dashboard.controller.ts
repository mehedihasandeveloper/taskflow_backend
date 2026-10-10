import { Project } from "../models/Project";
import { Task } from "../models/Task";
import { asyncHandler } from "../utils/asyncHandler";
import { projectAccess } from "../utils/access";

export const getDashboard = asyncHandler(async (_req, res) => {
  const access = projectAccess(res.locals.userId);
  const projectIds = await Project.find(access).distinct("_id");
  const inProjects = { project: { $in: projectIds } };
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [projects, tasks, completed, projectsThisWeek, tasksThisWeek, completedThisWeek, pendingThisWeek, recentProjects, recentTasks] =
    await Promise.all([
      Project.countDocuments(access),
      Task.countDocuments(inProjects),
      Task.countDocuments({ ...inProjects, status: "Completed" }),
      Project.countDocuments({ ...access, createdAt: { $gte: weekAgo } }),
      Task.countDocuments({ ...inProjects, createdAt: { $gte: weekAgo } }),
      Task.countDocuments({ ...inProjects, status: "Completed", updatedAt: { $gte: weekAgo } }),
      Task.countDocuments({ ...inProjects, status: { $ne: "Completed" }, createdAt: { $gte: weekAgo } }),
      Project.find(access).sort({ updatedAt: -1 }).limit(4),
      Task.find(inProjects).sort({ createdAt: -1 }).limit(5).populate("project", "name"),
    ]);

  res.json({
    stats: {
      projects,
      tasks,
      completed,
      pending: tasks - completed,
      projectsThisWeek,
      tasksThisWeek,
      completedThisWeek,
      pendingThisWeek,
    },
    recentProjects: recentProjects.map((p) => ({
      ...p.toJSON(),
      role: String(p.owner) === String(res.locals.userId) ? "owner" : "member",
    })),
    recentTasks: recentTasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      projectId: (t.project as unknown as { id?: string } | null)?.id ?? null,
      projectName: (t.project as unknown as { name?: string } | null)?.name ?? "Unknown project",
    })),
  });
});