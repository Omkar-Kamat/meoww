import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { getTurnCredentials } from "./webrtc.controller.js";

const router = Router();

router.get("/turn-credentials", requireAuth, getTurnCredentials);

export default router;
