const MODEL_NAME = "gemini-1.5-flash";
const SUPPORTED_USE_CASES = ["Gaming", "Video Editing", "Programming", "Office Work"];

module.exports = async function handler(req, res) {
  // Handle OPTIONS request for CORS / frontend checks
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Reject unsupported methods
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { budget, useCase } = req.body || {};

  // Validate request payload
  if (typeof budget !== 'number' || budget <= 0) {
    return res.status(400).json({ error: "Invalid budget" });
  }

  if (!SUPPORTED_USE_CASES.includes(useCase)) {
    return res.status(400).json({ error: "Invalid use case" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server configuration error" });
  }

  const prompt = `
You are an expert PC builder. Generate a PC build for a budget of ₹${budget} INR designed for ${useCase}.
Use reasonable indicative Indian prices. Do not pretend to have live component pricing. 
Do not include retailer-specific claims.

You MUST return ONLY a JSON object. NO markdown formatting, NO \`\`\`json blocks, and NO explanatory text outside the JSON.

Required JSON Structure:
{
  "components": [
    {
      "type": "CPU",
      "name": "Component Name",
      "spec": "Technical specs",
      "price": 10000,
      "altName": "Optional Alternative",
      "altSpec": "Optional Alternative specs"
    }
  ],
  "compatibility": [
    {
      "status": "ok", 
      "title": "Short title",
      "detail": "Detailed explanation"
    }
  ],
  "os": [
    {
      "name": "Windows 11",
      "icon": "&#129695;",
      "ramUsage": "~4GB idle",
      "reason": "Why it is recommended",
      "recommended": true
    }
  ],
  "bottleneck": {
    "cpu_score": 80,
    "gpu_score": 50,
    "analysis": "Explanation"
  },
  "performance_tiers": [
    {
      "label": "Budget",
      "performance": 80
    }
  ],
  "edu_cards": [
    {
      "title": "Card title",
      "body": "Explanation"
    }
  ],
  "upgradePath": "Recommended upgrade path string"
}
`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    return res.status(200).json(data);
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
};
