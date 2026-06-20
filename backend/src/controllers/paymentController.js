import Stripe from "stripe";
import dotenv from "dotenv";
import Transaction from "../models/Transaction.js";

dotenv.config();

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_DEMO = !STRIPE_KEY || STRIPE_KEY.includes("your_secret_key") || !STRIPE_KEY.startsWith("sk_");

let stripe = null;
if (!STRIPE_DEMO) {
  stripe = new Stripe(STRIPE_KEY);
} else {
  console.warn("⚠️  Stripe running in DEMO mode — no real payments processed");
}

/**
 * =========================
 * CREATE PAYMENT INTENT
 * =========================
 */
export const createPaymentIntent = async (req, res) => {
  try {
    const { amount, campaignId, influencerId } = req.body;

    // VALIDATION
    if (!amount || !campaignId || !influencerId) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    if (amount <= 0 || amount > 100000) {
      return res.status(400).json({
        message: "Invalid amount range",
      });
    }

    // Prevent duplicate transaction (IMPORTANT FIX)
    const existingTx = await Transaction.findOne({
      campaign: campaignId,
      brand: req.user._id,
      influencer: influencerId,
      status: { $in: ["pending", "created", "escrowed"] },
    });

    if (existingTx) {
      return res.status(400).json({
        message: "Transaction already exists for this campaign",
        transaction: existingTx,
      });
    }

    let clientSecret = null;
    let stripeIntentId = `demo_${Date.now()}`;

    if (!STRIPE_DEMO) {
      // Real Stripe payment
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: process.env.CURRENCY || "usd",
        automatic_payment_methods: { enabled: true },
        metadata: { campaignId, brandId: req.user._id.toString(), influencerId },
      });
      clientSecret = paymentIntent.client_secret;
      stripeIntentId = paymentIntent.id;
    }

    // CREATE TRANSACTION (demo mode: goes straight to escrowed)
    const transaction = await Transaction.create({
      campaign: campaignId,
      brand: req.user._id,
      influencer: influencerId,
      amount,
      status: STRIPE_DEMO ? "escrowed" : "created",
      stripePaymentIntentId: stripeIntentId,
    });

    req.app.get("io")
      .to(`user:${influencerId}`)
      .to("role:admin")
      .emit("data:update", { type: "payment:new", payload: { transactionId: transaction._id } });

    return res.status(200).json({
      clientSecret,
      transaction,
      demoMode: STRIPE_DEMO,
    });
  } catch (error) {
    console.error("❌ Payment Intent Error:", error);
    return res.status(500).json({
      message: "Payment initialization failed",
      error: error.message,
    });
  }
};

/**
 * =========================
 * STRIPE WEBHOOK
 * =========================
 */
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Webhook Error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {

      /**
       * PAYMENT SUCCESS → ESCROWED
       */
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;

        await Transaction.findOneAndUpdate(
          { stripePaymentIntentId: paymentIntent.id },
          {
            status: "escrowed",
          }
        );

        console.log(`💰 Escrowed: ${paymentIntent.id}`);
        break;
      }

      /**
       * PAYMENT FAILED
       */
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;

        await Transaction.findOneAndUpdate(
          { stripePaymentIntentId: paymentIntent.id },
          {
            status: "failed",
          }
        );

        console.log(`❌ Failed: ${paymentIntent.id}`);
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event: ${event.type}`);
    }

    return res.json({ received: true });
  } catch (error) {
    console.error("❌ Webhook Processing Error:", error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * =========================
 * RELEASE PAYMENT (ESCROW)
 * =========================
 */
export const releasePayment = async (req, res) => {
  try {
    const { transactionId } = req.body;

    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    // MUST be escrowed before release
    if (transaction.status !== "escrowed") {
      return res.status(400).json({
        message: "Payment is not in escrow state",
      });
    }

    // Fee calculation
    const platformFee = transaction.amount * 0.1;
    const influencerAmount = transaction.amount - platformFee;

    transaction.status = "completed";
    transaction.platformFee = platformFee;
    transaction.influencerAmount = influencerAmount;
    transaction.isReleased = true;
    transaction.releasedAt = new Date();

    await transaction.save();

    req.app.get("io")
      .to(`user:${transaction.influencer}`)
      .to(`user:${transaction.brand}`)
      .to("role:admin")
      .emit("data:update", { type: "payment:released", payload: { transactionId: transaction._id } });

    return res.status(200).json({
      message: "Payment released successfully",
      transaction,
    });
  } catch (error) {
    console.error("❌ Release Error:", error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

/**
 * =========================
 * GET MY TRANSACTIONS (Brand / Influencer)
 * =========================
 */
export const getMyTransactions = async (req, res) => {
  try {
    const query =
      req.user.role === "brand"
        ? { brand: req.user._id }
        : { influencer: req.user._id };

    const transactions = await Transaction.find(query)
      .populate("campaign", "title targetNiche")
      .populate("brand", "name")
      .populate("influencer", "name")
      .sort({ createdAt: -1 });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * =========================
 * GET ALL TRANSACTIONS (Admin)
 * =========================
 */
export const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({})
      .populate("campaign", "title")
      .populate("brand", "name")
      .populate("influencer", "name")
      .sort({ createdAt: -1 });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * =========================
 * GET TRANSACTION
 * =========================
 */
export const getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate("campaign")
      .populate("brand")
      .populate("influencer");

    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    return res.status(200).json(transaction);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};