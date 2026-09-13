export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing GEMINI_API_KEY environment variable on server.' });
  }

  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const promptText = payload.prompt || payload.requirements || JSON.stringify(payload);

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const apiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }]
      })
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      console.error('Gemini Provider Error:', data);
      return res.status(apiResponse.status).json({
        error: data.error?.message || 'Upstream Gemini API error',
        details: data.error || null
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Serverless Handler Crash:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
