import express from "express";
import {
  createPaymentIntent,
  handleStripeWebhook,
  releasePayment,
  getTransaction,
  getMyTransactions,
  getAllTransactions,
} from "../controllers/paymentController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create-intent", protect, createPaymentIntent);

// Stripe webhook — raw body, NO auth
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

router.post("/release", protect, releasePayment);
router.get("/my-transactions", protect, getMyTransactions);
router.get("/all-transactions", protect, getAllTransactions);
router.get("/:id", protect, getTransaction);

export default router;
