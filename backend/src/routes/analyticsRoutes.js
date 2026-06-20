import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getBrandAnalytics,
  getInfluencerAnalytics,
  getAdminAnalytics,
  getActivityLog,
} from "../controllers/analyticsController.js";

const router = express.Router();

// Brand analytics
router.get("/brand", protect, getBrandAnalytics);

// Influencer analytics
router.get("/influencer", protect, getInfluencerAnalytics);

// Admin analytics
router.get("/admin", protect, getAdminAnalytics);

// Admin activity log
router.get("/activity-log", protect, getActivityLog);

export default router;