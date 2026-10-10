import { Router } from "express";
import { protect } from "../middleware/auth";
import { validateObjectId } from "../middleware/validateId";
import { summarizeProject } from "../controllers/ai.controller";

const router = Router();
router.use(protect);

router.post(
  "/projects/:id/summary",
  validateObjectId("id", "project id"),
  summarizeProject
);

export default router;