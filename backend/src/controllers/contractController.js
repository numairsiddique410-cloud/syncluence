import Transaction from "../models/Transaction.js";

export const createContract = async (req, res) => {
  try {
    const { campaignId, influencerId, amount } = req.body;
    
    // Yahan hum contract generate karenge (e.g., PDF generation)
    const transaction = await Transaction.create({
      campaign: campaignId,
      brand: req.user._id,
      influencer: influencerId,
      amount,
      status: "pending"
    });

    res.status(201).json({ message: "Contract generated successfully", transaction });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};