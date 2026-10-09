import { Router } from "express";
import { protect } from "../middleware/auth";
import { validateObjectId } from "../middleware/validateId";
import { createProject, deleteProject, getProject, getProjects, updateProject } from "../controllers/project.controller";

const router = Router();
router.use(protect); // every project route requires login

router.route("/").get(getProjects).post(createProject);
router
  .route("/:id")
  .all(validateObjectId("id", "project id"))
  .get(getProject)
  .patch(updateProject)
  .delete(deleteProject);

export default router;