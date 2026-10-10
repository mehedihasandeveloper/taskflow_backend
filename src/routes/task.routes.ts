import { Router } from "express";
import { protect } from "../middleware/auth";
import { validateObjectId } from "../middleware/validateId";
import { createTask, deleteTask, getAllTasks, getTasks, updateTask } from "../controllers/task.controller";

// Mounted at /api, so the full paths below are /api/tasks, /api/tasks/:id and /api/projects/:projectId/tasks
const router = Router();

router.get("/tasks", protect, getAllTasks);

router
  .route("/projects/:projectId/tasks")
  .all(protect, validateObjectId("projectId", "project id"))
  .get(getTasks)
  .post(createTask);

router
  .route("/tasks/:id")
  .all(protect, validateObjectId("id", "task id"))
  .patch(updateTask)
  .delete(deleteTask);

export default router;