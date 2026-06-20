import express from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateProfile,
  updatePassword,
  getAllUsers,
  toggleSuspend,
  getBrandProfile,
  getFakeFollowerAnalysis,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateProfile);
router.put("/password", protect, updatePassword);
router.get("/all", protect, getAllUsers);
router.put("/:id/suspend", protect, toggleSuspend);
router.get("/brand-profile/:brandId", protect, getBrandProfile);
router.get("/fake-follower-analysis", protect, getFakeFollowerAnalysis);

router.put("/profile/image", protect, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  res.json({ message: "Image uploaded successfully", filePath: `/${req.file.path}` });
});

export default router;
