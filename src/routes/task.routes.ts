import { Router } from "express";
import { protect } from "../middleware/auth";
import { validateObjectId } from "../middleware/validateId";
import { createTask, deleteTask, getTasks, updateTask } from "../controllers/task.controller";

// Mounted at /api, so the full paths below are /api/projects/:projectId/tasks and /api/tasks/:id
const router = Router();

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