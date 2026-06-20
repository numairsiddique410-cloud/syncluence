import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createCampaign,
  getCampaigns,
  applyToCampaign,
  getMatchScore,
  getSentimentAnalysis,
  updateApplicationStatus,
  getBrandApplications,
  getMyApplications,
} from "../controllers/campaignController.js";

const router = express.Router();

router.post("/", protect, createCampaign);
router.get("/", getCampaigns);
router.post("/apply", protect, applyToCampaign);
router.post("/match-score", protect, getMatchScore);
router.post("/sentiment", protect, getSentimentAnalysis);
router.get("/brand-applications", protect, getBrandApplications);
router.get("/my-applications", protect, getMyApplications);
router.put("/application/:applicationId/status", protect, updateApplicationStatus);

export default router;