/**
 * Quantum OS - Otonom Çeviri Motoru
 * Gemini & Grok Desteği
 */
export async function translateDescription(text: string, targetLang: 'en' | 'ar') {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: settings } = await supabase.from('settings').select('*');
  const provider = settings?.find(s => s.key === 'ai_provider')?.value || 'gemini';
  const apiKey = settings?.find(s => s.key === 'ai_api_key')?.value;

  if (!apiKey || !text) return text;

  const prompt = `Aşağıdaki gayrimenkul ilan açıklamasını ${targetLang === 'en' ? 'İngilizceye' : 'Arapçaya'} profesyonel bir emlakçı diliyle çevir. Sadece çeviriyi döndür, başka açıklama yapma: \n\n ${text}`;

  try {
    if (provider === 'gemini') {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
      const data = await response.json();
      return data.candidates[0].content.parts[0].text.trim();
    } 
    
    if (provider === 'grok') {
      const response = await fetch(`https://api.x.ai/v1/chat/completions`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "grok-beta",
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await response.json();
      return data.choices[0].message.content.trim();
    }

    return text;
  } catch (error) {
    console.error("Çeviri hatası:", error);
    return text;
  }
}
