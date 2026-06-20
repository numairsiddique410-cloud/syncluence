import mongoose from 'mongoose';

const matchLogSchema = new mongoose.Schema({
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  influencer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  matchScore: Number,
  reasoning: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model('MatchLog', matchLogSchema);