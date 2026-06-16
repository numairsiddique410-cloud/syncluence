import fs from 'fs';

if (!fs.existsSync('./data')) {
  fs.mkdirSync('./data');
}

const niches = ["Tech", "Automotive", "Hospitality", "Fashion", "Fitness"];
const firstNames = ["Ali", "Sara", "Zaid", "Fatima", "Hamza", "Ayesha", "Bilal", "Hina", "Umer", "Kiran", "Faizan", "Sana", "Daniyal", "Mehwish", "Salman"];
const lastNames = ["Khan", "Ahmed", "Butt", "Noor", "Saeed", "Altaf", "Naz", "Sheikh", "Qureshi", "Malik", "Raza", "Javed", "Iqbal"];
const brandPrefixes = ["AutoSync", "TechSol", "GrandStay", "StyleIcon", "FitPro", "CarHub", "NextGen", "LuxStay", "Trendify", "HealthMax", "SwiftGear", "PrimeTech"];

const influencers = [];
const brands = [];
const campaigns = [];

// 1. Generate 500 Unique Influencers
for (let i = 1; i <= 500; i++) {
  const name = `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]} (${i})`;
  const engagement = (Math.random() * 5.5 + 0.5).toFixed(1);
  influencers.push({
    name: name,
    email: `${name.replace(/\s+/g, '').toLowerCase()}${i}@example.com`,
    password: "password123",
    role: "influencer",
    influencerDetails: { // Nested structure for better organization
      niche: niches[Math.floor(Math.random() * niches.length)],
      followers: Math.floor(Math.random() * 200000) + 1000,
      engagement_rate: parseFloat(engagement),
      is_fraud: parseFloat(engagement) < 1.5
    }
  });
}

// 2. Generate 500 Unique Brands
for (let i = 1; i <= 500; i++) {
  const brandName = `${brandPrefixes[i % brandPrefixes.length]} Corp ${i}`;
  brands.push({
    name: brandName,
    email: `brand${i}@example.com`,
    password: "password123",
    role: "brand",
    brandDetails: { // Nested structure
      niche: niches[Math.floor(Math.random() * niches.length)],
      budget: Math.floor(Math.random() * 5000) + 500,
      preferred_niche: niches[Math.floor(Math.random() * niches.length)]
    }
  });
}

// 3. Generate 300 Unique Campaigns
// generateData.js mein 300 Campaigns wala loop update karein:
for (let i = 1; i <= 300; i++) {
  const brandName = `${brandPrefixes[i % brandPrefixes.length]} Corp ${i}`;
  campaigns.push({
    title: `Campaign ${i}: ${brandName} Promotion`,
    description: `Targeting the ${niches[i % niches.length]} market.`,
    budget: Math.floor(Math.random() * 5000) + 500,
    targetNiche: niches[Math.floor(Math.random() * niches.length)],
    brand: "6a208503a4cca3993c5b485f" // Ek valid dummy ObjectId (ya baad mein update kar sakte hain)
  });
}
// Save files
fs.writeFileSync('./data/influencers.json', JSON.stringify(influencers, null, 2));
fs.writeFileSync('./data/brands.json', JSON.stringify(brands, null, 2));
fs.writeFileSync('./data/campaigns.json', JSON.stringify(campaigns, null, 2));

console.log("Data generated successfully with validation fields!");