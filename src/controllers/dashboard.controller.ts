import { Project } from "../models/Project";
import { Task } from "../models/Task";
import { asyncHandler } from "../utils/asyncHandler";

export const getDashboard = asyncHandler(async (_req, res) => {
  const owner = res.locals.userId;
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [projects, tasks, completed, projectsThisWeek, tasksThisWeek, completedThisWeek, pendingThisWeek, recentProjects, recentTasks] =
    await Promise.all([
      Project.countDocuments({ owner }),
      Task.countDocuments({ owner }),
      Task.countDocuments({ owner, status: "Completed" }),
      Project.countDocuments({ owner, createdAt: { $gte: weekAgo } }),
      Task.countDocuments({ owner, createdAt: { $gte: weekAgo } }),
      Task.countDocuments({ owner, status: "Completed", updatedAt: { $gte: weekAgo } }),
      Task.countDocuments({ owner, status: { $ne: "Completed" }, createdAt: { $gte: weekAgo } }),
      Project.find({ owner }).sort({ updatedAt: -1 }).limit(4),
      Task.find({ owner }).sort({ createdAt: -1 }).limit(5).populate("project", "name"),
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
    recentProjects,
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