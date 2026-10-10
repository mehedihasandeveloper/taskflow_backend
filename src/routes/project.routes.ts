import { Router } from "express";
import { protect } from "../middleware/auth";
import { validateObjectId } from "../middleware/validateId";
import {
  addMember, createProject, deleteProject, getMembers, getProject, getProjects, removeMember, updateProject,
} from "../controllers/project.controller";

const router = Router();
router.use(protect); // every project route requires login

router.route("/").get(getProjects).post(createProject);
router
  .route("/:id")
  .all(validateObjectId("id", "project id"))
  .get(getProject)
  .patch(updateProject)
  .delete(deleteProject);

router.route("/:id/members").all(validateObjectId("id", "project id")).get(getMembers).post(addMember);
router.delete("/:id/members/:userId", validateObjectId("id", "project id"), validateObjectId("userId", "user id"), removeMember);

export default router;