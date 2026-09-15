module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing GEMINI_API_KEY environment variable on server.' });
  }

  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const budget = payload.budget || 0;
    const useCase = payload.useCase || "General";
    const promptText = `
You are a PC building expert. Generate a complete build recommendation in raw JSON format for a budget of ₹${budget} INR designed for ${useCase}.
Use reasonable indicative Indian prices. Do not pretend to have live component pricing.

The JSON MUST match this exact structure (no markdown, no code blocks):
{
  "components": [
    {
      "type": "CPU",
      "name": "Component Name",
      "spec": "Technical specs",
      "price": 10000,
      "altName": "Optional Alternative",
      "altSpec": "Optional specs"
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
  "upgradePath": "Recommended upgrade path"
}
`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
    const fetchOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    };

    const delays = [500, 1500, 3000];
    let apiResponse;
    let data;

    for (let attempt = 0; attempt <= delays.length; attempt++) {
      apiResponse = await fetch(geminiUrl, fetchOptions);
      data = await apiResponse.json();

      if (apiResponse.ok) {
        return res.status(200).json(data);
      }

      const isUnavailable = apiResponse.status === 503 || data.error?.status === 'UNAVAILABLE';
      
      if (!isUnavailable || attempt === delays.length) {
        console.error('Gemini Provider Error:', data);
        return res.status(apiResponse.status).json({
          error: data.error?.message || 'Upstream Gemini API error',
          details: data.error || null
        });
      }

      await new Promise(r => setTimeout(r, delays[attempt]));
    }

  } catch (error) {
    console.error('Serverless Handler Crash:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
