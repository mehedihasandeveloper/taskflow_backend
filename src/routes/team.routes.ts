import { Router } from "express";
import { protect } from "../middleware/auth";
import { getTeam } from "../controllers/team.controller";

const router = Router();
router.get("/", protect, getTeam);

export default router;