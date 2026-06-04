require('dotenv').config({ path: '.env.local' });
const apiKey = process.env.GEMINI_API_KEY;

async function testError() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const prompt = `Aşağıdaki form verilerini analiz et. JSON döndür. Format: {"score": 85, "intent_level": "Hot"}`;
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });
    
    const text = await res.text();
    console.log(`Status: ${res.status}`);
    console.log(`Body:`, text);
  } catch (e) {
    console.error("Fetch Error:", e.message);
  }
}

testError();
