import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

/* ──────────────────────────────────────────
   GET or CREATE conversation between two users
────────────────────────────────────────── */
export const getOrCreateConversation = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const userId = req.user._id;

    if (!recipientId) return res.status(400).json({ message: "recipientId is required" });
    if (recipientId === userId.toString()) return res.status(400).json({ message: "Cannot start conversation with yourself" });

    const recipient = await User.findById(recipientId);
    if (!recipient) return res.status(404).json({ message: "User not found" });

    let conversation = await Conversation.findOne({
      participants: { $all: [userId, recipientId], $size: 2 },
    })
      .populate("participants", "name email role")
      .lean();

    if (!conversation) {
      const created = await Conversation.create({
        participants: [userId, recipientId],
        unreadCounts: { [recipientId]: 0, [userId.toString()]: 0 },
      });
      conversation = await Conversation.findById(created._id)
        .populate("participants", "name email role")
        .lean();
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ──────────────────────────────────────────
   GET all conversations for current user
────────────────────────────────────────── */
export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate("participants", "name email role")
      .sort({ lastMessageAt: -1 })
      .lean();

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ──────────────────────────────────────────
   GET messages for a conversation (paginated)
────────────────────────────────────────── */
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });
    if (!conversation) return res.status(403).json({ message: "Conversation not found or access denied" });

    const messages = await Message.find({ conversation: conversationId })
      .populate("sender", "name role")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    // Mark messages from others as read
    await Message.updateMany(
      { conversation: conversationId, sender: { $ne: req.user._id }, read: false },
      { read: true }
    );

    // Reset unread count
    await Conversation.findByIdAndUpdate(conversationId, {
      $set: { [`unreadCounts.${req.user._id}`]: 0 },
    });

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ──────────────────────────────────────────
   SEND a message (also emitted via socket)
────────────────────────────────────────── */
export const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) return res.status(400).json({ message: "Message cannot be empty" });

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });
    if (!conversation) return res.status(403).json({ message: "Conversation not found or access denied" });

    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      content: content.trim(),
    });

    await message.populate("sender", "name role");

    // Update conversation metadata
    const otherParticipant = conversation.participants.find(
      (p) => p.toString() !== req.user._id.toString()
    );
    const currentUnread = conversation.unreadCounts?.get?.(otherParticipant?.toString()) || 0;
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: content.trim().slice(0, 100),
      lastMessageAt: new Date(),
      $set: { [`unreadCounts.${otherParticipant}`]: currentUnread + 1 },
    });

    // Emit via socket (attached to req.app)
    const io = req.app.get("io");
    if (io) {
      io.to(conversationId).emit("receive_message", message);
    }

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ──────────────────────────────────────────
   GET total unread count for current user
────────────────────────────────────────── */
export const getUnreadCount = async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id });
    let total = 0;
    conversations.forEach((c) => {
      total += c.unreadCounts?.get?.(req.user._id.toString()) || 0;
    });
    res.json({ unread: total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ──────────────────────────────────────────
   ADMIN: GET all conversations on platform
────────────────────────────────────────── */
export const adminGetConversations = async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Admin access required" });

    const conversations = await Conversation.find({})
      .populate("participants", "name email role")
      .sort({ lastMessageAt: -1 })
      .lean();

    // Attach message count to each
    const withCounts = await Promise.all(
      conversations.map(async (c) => {
        const count = await Message.countDocuments({ conversation: c._id });
        return { ...c, messageCount: count };
      })
    );

    res.json(withCounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ──────────────────────────────────────────
   ADMIN: READ messages of any conversation
────────────────────────────────────────── */
export const adminGetMessages = async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Admin access required" });

    const { conversationId } = req.params;
    const messages = await Message.find({ conversation: conversationId })
      .populate("sender", "name role")
      .sort({ createdAt: 1 })
      .lean();

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
