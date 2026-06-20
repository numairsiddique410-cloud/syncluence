const POSITIVE = new Set([
  "innovative", "creative", "premium", "authentic", "inspiring", "dynamic",
  "engaging", "passionate", "talented", "professional", "quality", "luxury",
  "trendy", "popular", "successful", "powerful", "trusted", "exciting",
  "amazing", "brilliant", "excellent", "outstanding", "remarkable", "unique",
  "exclusive", "aesthetic", "vibrant", "energetic", "motivating", "empowering",
  "stylish", "modern", "fresh", "bold", "iconic", "influential", "versatile",
  "genuine", "credible", "consistent", "growth", "lifestyle", "organic",
  "wellness", "fitness", "fashion", "beauty", "technology", "health",
]);

const NEGATIVE = new Set([
  "fake", "boring", "dull", "spam", "scam", "cheap", "poor", "bad",
  "terrible", "awful", "mediocre", "unprofessional", "outdated", "irrelevant",
  "low", "weak", "negative", "problematic", "controversial", "risky",
  "declining", "inactive", "stagnant", "unreliable", "inconsistent",
]);

export const analyzeSentiment = (text) => {
  if (!text || typeof text !== "string") {
    return { sentiment: "neutral", score: 50, polarity: 0, keywords: { positive: [], negative: [] }, label: "Neutral" };
  }

  const words = text.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter(Boolean);
  const positiveHits = [];
  const negativeHits = [];

  words.forEach((word) => {
    if (POSITIVE.has(word)) positiveHits.push(word);
    if (NEGATIVE.has(word)) negativeHits.push(word);
  });

  const pos = positiveHits.length;
  const neg = negativeHits.length;
  const total = pos + neg;
  const polarity = total > 0 ? (pos - neg) / total : 0;
  const score = Math.round(((polarity + 1) / 2) * 100);

  let sentiment, label;
  if (polarity > 0.2) { sentiment = "positive"; label = "Positive Tone"; }
  else if (polarity < -0.2) { sentiment = "negative"; label = "Negative Tone"; }
  else { sentiment = "neutral"; label = "Neutral Tone"; }

  return {
    sentiment,
    score,
    polarity: Math.round(polarity * 100) / 100,
    keywords: {
      positive: [...new Set(positiveHits)].slice(0, 5),
      negative: [...new Set(negativeHits)].slice(0, 5),
    },
    label,
  };
};

export const analyzeCompatibility = (campaign, influencer) => {
  const campaignText = [
    campaign.title || "",
    campaign.description || "",
    campaign.targetNiche || "",
  ].join(" ");

  const influencerText = [
    influencer.influencerDetails?.niche || "",
    influencer.name || "",
  ].join(" ");

  const campaignSentiment = analyzeSentiment(campaignText);
  const influencerSentiment = analyzeSentiment(influencerText);

  const polarityDiff = Math.abs(campaignSentiment.polarity - influencerSentiment.polarity);
  const compatibility = Math.round((1 - polarityDiff / 2) * 100);

  return { campaign: campaignSentiment, influencer: influencerSentiment, compatibility };
};
