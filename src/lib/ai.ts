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

/**
 * Quantum OS - AI Lead Yeterlilik Analizi (Scoring)
 */
export async function evaluateLead(leadData: any): Promise<{ score: number, intent_level: string }> {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: settings } = await supabase.from('settings').select('*');
  const provider = settings?.find(s => s.key === 'ai_provider')?.value || 'gemini';
  const apiKey = settings?.find(s => s.key === 'ai_api_key')?.value;

  const defaultResult = { score: 50, intent_level: 'Warm' };
  
  if (!apiKey) return defaultResult;

  const prompt = `
Sen "Kaynak Gayrimenkul Quantum OS" sisteminin yapay zeka analiz motorusun.
Aşağıdaki potansiyel müşteri (lead) talebini analiz et ve ona 0 ile 100 arasında bir "score" ve niyet seviyesini belirten bir "intent_level" (Cold, Warm, Hot, VIP seçeneklerinden biri) ata.
Müşteri mesajı ne kadar spesifikse ve bütçe ne kadar yüksek/netse skor o kadar yüksek olmalıdır.
Lütfen sadece geçerli bir JSON objesi döndür, markdown veya başka bir metin kullanma. 
Format: {"score": 85, "intent_level": "Hot"}

Müşteri Verisi:
Bölge: ${leadData.district || 'Belirtilmedi'}
Bütçe: ${leadData.budget || 'Belirtilmedi'}
İşlem Tipi: ${leadData.propertyType || 'Belirtilmedi'}
Mesaj: ${leadData.message || 'Yok'}
`;

  try {
    let aiText = '';
    
    if (provider === 'gemini') {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
      const data = await response.json();
      aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
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
      aiText = data.choices?.[0]?.message?.content || '';
    }

    // JSON formatını temizleyip parse etme
    const jsonStr = aiText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    const result = JSON.parse(jsonStr);
    
    return {
      score: result.score || defaultResult.score,
      intent_level: result.intent_level || defaultResult.intent_level
    };

  } catch (error) {
    console.error("Lead analiz hatası:", error);
    return defaultResult;
  }
}

/**
 * Quantum OS - AI Fiyat Analizi
 */
export async function analyzePriceWithAI(propertyData: any): Promise<{ evaluation: string, estimated_value: string, suggestion: string }> {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: settings } = await supabase.from('settings').select('*');
  const provider = settings?.find(s => s.key === 'ai_provider')?.value || 'gemini';
  const apiKey = settings?.find(s => s.key === 'ai_api_key')?.value;

  const defaultResult = { 
    evaluation: "Piyasa verisi eksik.", 
    estimated_value: "Hesaplanamıyor", 
    suggestion: "Manuel değerleme yapınız." 
  };
  
  if (!apiKey) return defaultResult;

  const prompt = `
Sen "Kaynak Gayrimenkul Quantum OS" sisteminin değerleme uzmanısın.
Aşağıdaki gayrimenkul verisini analiz et ve mantıklı bir piyasa değerlendirmesi yap.
Cevabını SADECE geçerli bir JSON olarak ver:
{
  "evaluation": "Fiyat piyasa ortalamasının biraz üzerinde/altında/tam değerinde...",
  "estimated_value": "4.500.000 TL - 4.800.000 TL",
  "suggestion": "Fiyatı 4.5M'ye çekmek satışı hızlandırır veya bu fiyattan beklemeye değer."
}

Gayrimenkul Verisi:
İlan Başlığı: ${propertyData.title}
Fiyat: ${propertyData.price} TL
Bölge: ${propertyData.district_id}
Metrekare: ${propertyData.sqm}
Oda: ${propertyData.rooms}
Tipi: ${propertyData.type}
`;

  try {
    let aiText = '';
    
    if (provider === 'gemini') {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
      const data = await response.json();
      aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
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
      aiText = data.choices?.[0]?.message?.content || '';
    }

    const jsonStr = aiText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    return JSON.parse(jsonStr);

  } catch (error) {
    console.error("AI Fiyat Analizi hatası:", error);
    return defaultResult;
  }
}

