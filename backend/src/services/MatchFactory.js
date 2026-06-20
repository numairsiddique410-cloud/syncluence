export const MatchFactory = {
  createScorer: (type) => {
    if (type === 'AI-Weighted') {
      return (campaign, influencer) => {
        const details = influencer.influencerDetails || {};
        const stats = details.stats || {};

        const niche = details.niche || "";
        const followerCount = details.followerCount || 1;
        const avgLikes = stats.avgLikes || 0;
        const avgComments = stats.avgComments || 0;
        const engagementRate = ((avgLikes + avgComments * 2) / followerCount) * 100;

        let score = 0;
        const reasons = [];

        // 1. Niche Weight (60%)
        const campaignNiche = (campaign.targetNiche || "").toLowerCase();
        const influencerNiche = niche.toLowerCase();
        if (campaignNiche && influencerNiche && influencerNiche.includes(campaignNiche)) {
          score += 60;
          reasons.push(`Niche match: ${niche} aligns with ${campaign.targetNiche}`);
        } else if (campaignNiche && influencerNiche) {
          reasons.push(`Niche mismatch: brand wants ${campaign.targetNiche}, influencer is ${niche}`);
        }

        // 2. Engagement Weight (30%) — normalized to 5% baseline
        const engagementScore = Math.min((engagementRate / 5) * 30, 30);
        score += engagementScore;
        if (engagementRate > 3.0) reasons.push(`Strong engagement rate: ${engagementRate.toFixed(2)}%`);
        else if (engagementRate > 0) reasons.push(`Engagement rate: ${engagementRate.toFixed(2)}%`);

        // 3. Reach Weight (10%) — logarithmic scaling
        const followerScore = Math.min((Math.log10(followerCount + 1) / 6) * 10, 10);
        score += followerScore;
        if (followerCount > 100000) reasons.push(`Large audience: ${followerCount.toLocaleString()} followers`);
        else if (followerCount > 10000) reasons.push(`Growing audience: ${followerCount.toLocaleString()} followers`);

        if (reasons.length === 0) reasons.push("Basic profile match — add stats for better scoring");

        return {
          matchScore: Math.round(Math.min(score, 100)),
          reasoning: reasons,
        };
      };
    }
    return null;
  }
};