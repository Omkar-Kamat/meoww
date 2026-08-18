import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validateBody } from "../../middleware/validate.middleware.js";
import { reportSchema, blockSchema } from "./trust-safety.schema.js";
import { reportUser, blockUser } from "./trust-safety.controller.js";

const router = Router();

router.post("/report", requireAuth, validateBody(reportSchema), reportUser);
router.post("/block", requireAuth, validateBody(blockSchema), blockUser);

export default router;
