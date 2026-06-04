const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkConnections() {
  console.log("=========================================");
  console.log("⚙️  Quantum OS Entegrasyon & Bağlantı Denetimi");
  console.log("=========================================");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const envGeminiKey = process.env.GEMINI_API_KEY;

  console.log("1. Supabase Yapılandırması:");
  console.log("   - URL:", supabaseUrl);
  console.log("   - Service Key Mevcut mu?:", !!supabaseKey);

  const supabase = createClient(supabaseUrl, supabaseKey);

  let dbGeminiKey = null;
  let dbProvider = null;

  try {
    const { data: settings } = await supabase.from('settings').select('*');
    if (settings) {
      settings.forEach(s => {
        if (s.key === 'ai_api_key') dbGeminiKey = s.value.trim();
        if (s.key === 'ai_provider') dbProvider = s.value.trim();
      });
    }
  } catch (e) {
    console.error("Supabase Error:", e.message);
  }

  async function testKey(key, sourceName) {
    console.log(`\n--- Test Ediliyor: ${sourceName} (${key ? key.substring(0, 10) + '...' : 'Boş'}) ---`);
    if (!key) {
      console.log("❌ Test edilemedi: Anahtar boş.");
      return false;
    }
    const testPrompt = "Ping";
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    try {
      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: testPrompt }] }]
        })
      });
      if (response.ok) {
        const data = await response.json();
        const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        console.log(`✅ API Bağlantısı BAŞARILI! Cevap: "${aiReply}"`);
        return true;
      } else {
        const errorText = await response.text();
        console.log(`❌ API Hatası (Durum: ${response.status}):`, errorText);
        return false;
      }
    } catch (e) {
      console.log("❌ Bağlantı hatası:", e.message);
      return false;
    }
  }

  const envSuccess = await testKey(envGeminiKey, "Çevre Değişkeni (env) Key");
  const dbSuccess = await testKey(dbGeminiKey, "Veritabanı (settings) Key");

  if (!envSuccess && !dbSuccess) {
    console.log("\n⚠️ UYARI: Her iki anahtar da geçersiz çıktı.");
  } else if (envSuccess && !dbSuccess) {
    console.log("\n💡 FARK EDİLDİ: .env.local içerisindeki anahtar çalışıyor fakat veritabanındaki anahtar geçersiz.");
    console.log("   Uygulamayı düzeltmek için veritabanındaki geçersiz anahtarı .env.local'deki çalışan anahtarla senkronize etmeliyiz!");
  } else if (!envSuccess && dbSuccess) {
    console.log("\n💡 FARK EDİLDİ: Veritabanındaki anahtar çalışıyor fakat .env.local'deki anahtar geçersiz.");
  } else {
    console.log("\n🎉 HARİKA: Her iki anahtar da geçerli ve çalışıyor!");
  }
}

checkConnections();
