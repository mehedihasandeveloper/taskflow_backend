import { Router } from "express";
import { protect } from "../middleware/auth";
import { getMe } from "../controllers/user.controller";

const router = Router();
router.get("/me", protect, getMe);

export default router;