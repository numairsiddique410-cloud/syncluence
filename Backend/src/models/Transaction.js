import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },

    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    influencer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    platformFee: {
      type: Number,
      default: 0,
    },

    influencerAmount: {
      type: Number,
      default: 0,
    },

    currency: {
      type: String,
      default: "usd",
    },

    status: {
      type: String,
      enum: [
        "pending",            // initial creation
        "created",            // payment intent created
        "escrowed",           // payment confirmed by stripe
        "in_progress",        // campaign running
        "awaiting_release",   // brand approval pending
        "completed",          // payment released
        "failed",             // payment failed
        "refunded",           // refunded to brand
        "disputed",           // conflict case
      ],
      default: "pending",
    },

    stripePaymentIntentId: {
      type: String,
      index: true,
    },

    stripeChargeId: {
      type: String,
    },

    isReleased: {
      type: Boolean,
      default: false,
    },

    releasedAt: {
      type: Date,
    },

    failureReason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

/**
 * INDEXES for performance (important for FYP + scalability)
 */
transactionSchema.index({ brand: 1, status: 1 });
transactionSchema.index({ influencer: 1, status: 1 });
transactionSchema.index({ campaign: 1 });

export default mongoose.model("Transaction", transactionSchema);