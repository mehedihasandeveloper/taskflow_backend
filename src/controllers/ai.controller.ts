import { Project } from "../models/Project";
import { Task } from "../models/Task";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { projectAccess } from "../utils/access";
import { env } from "../config/env";

export const summarizeProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = res.locals.userId;

  const project = await Project.findOne({ _id: id, ...projectAccess(userId) });
  if (!project) throw new ApiError(404, "Project not found");

  const tasks = await Task.find({ project: id }).sort({ createdAt: -1 });

  const payload = {
    project_name: project.name,
    project_description: project.description || "",
    project_status: project.status,
    tasks: tasks.map((t) => ({
      title: t.title,
      description: t.description || "",
      status: t.status,
      priority: t.priority,
      due_date: t.dueDate ? t.dueDate.toISOString().slice(0, 10) : null,
    })),
  };

  const aiRes = await fetch(`${env.aiServiceUrl}/summarize-project`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!aiRes.ok) {
    const err = await aiRes.json().catch(() => ({}));
    throw new ApiError(502, (err as any).detail || "AI service unavailable");
  }

  const summary = await aiRes.json();
  res.json(summary);
});