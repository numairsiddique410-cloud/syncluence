import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage,
  getUnreadCount,
  adminGetConversations,
  adminGetMessages,
} from "../controllers/chatController.js";

const router = express.Router();

router.post("/conversation", protect, getOrCreateConversation);
router.get("/conversations", protect, getConversations);
router.get("/unread", protect, getUnreadCount);
router.get("/admin/conversations", protect, adminGetConversations);
router.get("/admin/:conversationId/messages", protect, adminGetMessages);
router.get("/:conversationId/messages", protect, getMessages);
router.post("/:conversationId/messages", protect, sendMessage);

export default router;
