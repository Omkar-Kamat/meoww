import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validateBody } from "../../middleware/validate.middleware.js";
import { apiRateLimiter } from "../../middleware/rateLimit.middleware.js";
import { reportSchema, blockSchema } from "./trust-safety.schema.js";
import { reportUser, blockUser } from "./trust-safety.controller.js";

const router = Router();

router.post("/report", requireAuth, apiRateLimiter, validateBody(reportSchema), reportUser);
router.post("/block", requireAuth, apiRateLimiter, validateBody(blockSchema), blockUser);

export default router;
