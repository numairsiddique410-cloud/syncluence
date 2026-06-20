import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import jwt from "jsonwebtoken";

import connectDB from "./config/db.js";
import User from "./models/User.js";

import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import campaignRoutes from "./routes/campaignRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import { handleStripeWebhook } from "./controllers/paymentController.js";

dotenv.config();
connectDB();

const app = express();
const httpServer = createServer(app);

/* ═══════════════════════════════════════
   SOCKET.IO
═══════════════════════════════════════ */
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.set("io", io);

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication required"));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return next(new Error("User not found"));
    socket.user = user;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  // Join personal + role rooms for targeted data:update events
  socket.join(`user:${socket.user._id}`);
  socket.join(`role:${socket.user.role}`);

  // Join a conversation room
  socket.on("join_conversation", (conversationId) => {
    socket.join(conversationId);
  });

  // Leave a conversation room
  socket.on("leave_conversation", (conversationId) => {
    socket.leave(conversationId);
  });

  // Typing indicators
  socket.on("typing", ({ conversationId }) => {
    socket.to(conversationId).emit("user_typing", {
      userId: socket.user._id,
      name: socket.user.name,
    });
  });

  socket.on("stop_typing", ({ conversationId }) => {
    socket.to(conversationId).emit("user_stop_typing", { userId: socket.user._id });
  });

  socket.on("disconnect", () => {});
});

/* ═══════════════════════════════════════
   CORS
═══════════════════════════════════════ */
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }));

/* ═══════════════════════════════════════
   STRIPE WEBHOOK (must be before json())
═══════════════════════════════════════ */
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

/* ═══════════════════════════════════════
   BODY PARSER
═══════════════════════════════════════ */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ═══════════════════════════════════════
   ROUTES
═══════════════════════════════════════ */
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/chat", chatRoutes);

/* ═══════════════════════════════════════
   STATIC FILES
═══════════════════════════════════════ */
const __dirname = path.resolve();
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

/* ═══════════════════════════════════════
   HEALTH CHECK
═══════════════════════════════════════ */
app.get("/", (_, res) => {
  res.json({ message: "Syncluence API running", modules: ["Auth", "Campaigns", "AI", "Payments", "Chat"] });
});

/* ═══════════════════════════════════════
   ERROR HANDLER
═══════════════════════════════════════ */
app.use((err, req, res, next) => {
  const status = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(status).json({
    message: err.message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

/* ═══════════════════════════════════════
   START
═══════════════════════════════════════ */
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Syncluence Server running on port ${PORT}`);
});
