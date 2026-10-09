import { Router } from "express";
import { protect } from "../middleware/auth";
import { changePassword, getMe, updateMe } from "../controllers/user.controller";

const router = Router();
router.use(protect);

router.route("/me").get(getMe).patch(updateMe);
router.patch("/me/password", changePassword);

export default router;