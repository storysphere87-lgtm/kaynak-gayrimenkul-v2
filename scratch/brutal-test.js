const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const apiKey = process.env.GEMINI_API_KEY;

if (!supabaseUrl || !supabaseKey || !apiKey) {
  console.error("❌ HATA: Gerekli çevre değişkenleri eksik (.env.local kontrol edin)");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTranslation() {
  console.log("\n🧪 TEST 1: Otonom Çeviri Motoru (translateDescription)");
  const sampleText = "Çankaya Oran'da muhteşem vadi manzaralı, 4+1 lüks rezidans daire. Geniş teraslı ve kapalı otoparklı.";
  
  const prompt = `Aşağıdaki gayrimenkul ilan açıklamasını İngilizceye profesyonel bir emlakçı diliyle çevir. Sadece çeviriyi döndür, başka açıklama yapma: \n\n ${sampleText}`;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const startTime = Date.now();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    if (!res.ok) throw new Error(`HTTP Error: ${res.status} - ${await res.text()}`);
    
    const data = await res.json();
    const translation = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    const duration = Date.now() - startTime;
    
    console.log(`⏱️ Süre: ${duration}ms`);
    console.log(`📥 Girdi: "${sampleText}"`);
    console.log(`📤 Çeviri (EN): "${translation}"`);
    if (translation && translation.length > 10 && !translation.includes("error")) {
      console.log("✅ Çeviri Motoru: BAŞARILI");
    } else {
      console.log("❌ Çeviri Motoru: Hatalı veya Boş Çıktı");
    }
  } catch (e) {
    console.error("❌ Çeviri Motoru hatası:", e.message);
  }
}

async function testLeadEvaluation() {
  console.log("\n🧪 TEST 2: AI Lead Yeterlilik Analizi (evaluateLead)");
  
  const leadData = {
    name: "Murat Kaynak",
    district: "Çankaya",
    budget: "15000000",
    propertyType: "Satılık",
    message: "Oran bölgesindeki projelerinizle ilgileniyorum, acil dönüş bekliyorum.",
    behavior_data: {
      totalViews: 12,
      preferredDistricts: { "cankaya": 8, "golbasi": 4 },
      averageBudget: 14500000,
      highestPriceViewed: 18000000,
      viewedProperties: ["prop-1", "prop-2", "prop-3"]
    }
  };

  const prompt = `
  Aşağıdaki form verilerini ve kullanıcının sitedeki davranış verilerini analiz et.
  Müşteri için 0 ile 100 arasında bir "score" ve niyet seviyesini belirten bir "intent_level" (Cold, Warm, Hot, VIP seçeneklerinden biri) ata.
  Lütfen sadece geçerli bir JSON objesi döndür.
  Format: {"score": 85, "intent_level": "Hot"}
  
  Müşteri Form Verileri:
  - İsim: ${leadData.name}
  - Bölge Tercihi: ${leadData.district}
  - Bütçe Tercihi: ${leadData.budget}
  - İşlem Tipi: ${leadData.propertyType}
  - Mesaj: ${leadData.message}
  
  Davranış Verileri:
  - Sayfa Görüntüleme: ${leadData.behavior_data.totalViews}
  - Ortalama Bütçe: ${leadData.behavior_data.averageBudget} TL
  `;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const startTime = Date.now();

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });
    
    if (!res.ok) throw new Error(`HTTP Error: ${res.status} - ${await res.text()}`);
    
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    const duration = Date.now() - startTime;
    
    console.log(`⏱️ Süre: ${duration}ms`);
    console.log(`📤 Yanıt:`, text);
    const parsed = JSON.parse(text);
    if (parsed.score !== undefined && parsed.intent_level !== undefined) {
      console.log(`✅ Lead Analiz: BAŞARILI (Skor: ${parsed.score}, Seviye: ${parsed.intent_level})`);
    } else {
      console.log("❌ Lead Analiz: Beklenen JSON şablonu bulunamadı");
    }
  } catch (e) {
    console.error("❌ Lead Analiz hatası:", e.message);
  }
}

async function testLegalCompliance() {
  console.log("\n🧪 TEST 3: AI Yasal Uyum ve Reklam Denetim Filtresi (checkLegalCompliance)");
  
  const badTitle = "!!! BEDAVA KELEPİR ACİL SATILIK KAÇIRAN AĞLAR !!!";
  const badDesc = "Piyasanın yarı fiyatına, emsalsiz bedava villa. Gel al hemen kazan. Sahibinden acil paraya sıkışık.";

  const prompt = `
    Aşağıdaki ilan başlığını ve açıklamasını Türkiye Taşınmaz Ticareti Yönetmeliği kurallarına göre denetle.
    Analiz sonucunu SADECE şu şablonda geçerli bir JSON olarak döndür:
    {
      "is_compliant": false,
      "warning_reason": "gerekçe..."
    }
    
    İLAN BAŞLIĞI: "${badTitle}"
    İLAN AÇIKLAMASI: "${badDesc}"
  `;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const startTime = Date.now();

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });
    
    if (!res.ok) throw new Error(`HTTP Error: ${res.status} - ${await res.text()}`);
    
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    const duration = Date.now() - startTime;
    
    console.log(`⏱️ Süre: ${duration}ms`);
    console.log(`📤 Yanıt:`, text);
    const parsed = JSON.parse(text);
    if (parsed.is_compliant === false && parsed.warning_reason) {
      console.log(`✅ Reklam Denetimi: BAŞARILI (İhlal Tespit Edildi: "${parsed.warning_reason.substring(0, 50)}...")`);
    } else {
      console.log("❌ Reklam Denetimi: Başarısız veya beklenen JSON kısıtlamalarına uymadı");
    }
  } catch (e) {
    console.error("❌ Reklam Denetimi hatası:", e.message);
  }
}

async function testNegotiationAndCRM() {
  console.log("\n🧪 TEST 4: AI Müzakere Asistanı & CRM Entegrasyonu (negotiate)");
  
  // Önce Supabase'den rastgele bir ilan çekelim
  const { data: properties, error } = await supabase.from('properties').select('id, title, price, district_id, rooms, sqm').limit(1);
  if (error || !properties || properties.length === 0) {
    console.log("⚠️ Veritabanında aktif ilan bulunamadı, müzakere testi yapılamıyor.");
    return;
  }
  
  const testProp = properties[0];
  console.log(`🔍 Test İlanı Bulundu: "${testProp.title}" - Fiyat: ${testProp.price.toLocaleString('tr-TR')} TL`);

  const buyerMessage = "Merhaba, bu daireyi çok beğendim ancak fiyatı bütçemi aşıyor. 12.000.000 TL nakit ödeme ile hemen alabilirim. Mümkün müdür?";
  const buyerName = "Hard Test Alıcı";
  const buyerPhone = "+905559998877";

  const prompt = `
    Sen Kaynak Gayrimenkul AI Müzakerecisisin.
    Mülk: ${testProp.title} | Liste Fiyatı: ${testProp.price} TL.
    Alıcı: ${buyerName} | Teklif: 12.000.000 TL.
    
    JSON şablonunda cevap dön:
    {
      "reply": "cevap metni...",
      "intentScore": 80,
      "intentLevel": "HOT",
      "predictedMaxBudget": "13000000",
      "summary": "özet..."
    }
    
    Alıcı Mesajı: "${buyerMessage}"
  `;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const startTime = Date.now();

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });
    
    if (!res.ok) throw new Error(`HTTP Error: ${res.status} - ${await res.text()}`);
    
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    const duration = Date.now() - startTime;
    
    console.log(`⏱️ Süre: ${duration}ms`);
    console.log(`📤 Gemini Yanıtı:`, text);
    const parsed = JSON.parse(text);

    // CRM Lead Oluşturma Testi
    console.log("💾 CRM veritabanına lead kaydı ekleniyor...");
    const { data: insertedLead, error: leadError } = await supabase
      .from('leads')
      .insert([{
        full_name: buyerName,
        phone: buyerPhone,
        property_id: testProp.id,
        score: parsed.intentScore || 50,
        intent_level: parsed.intentLevel || 'WARM',
        source: 'AI Müzakereci (Hard Test)',
        message: `[Hard Test] ${parsed.summary || ''} | Tahmini Bütçe: ${parsed.predictedMaxBudget}`
      }])
      .select('id')
      .single();

    if (leadError) throw leadError;
    console.log(`✅ Lead CRM'e başarıyla yazıldı! ID: ${insertedLead.id}`);

    // Lead zaman tüneli kaydı testi
    const { error: intError } = await supabase
      .from('customer_interactions')
      .insert([{
        lead_id: insertedLead.id,
        event_type: 'negotiation_offer',
        details: {
          property_id: testProp.id,
          offer_amount: 12000000,
          buyer_message: buyerMessage,
          ai_reply: parsed.reply,
          intent_score: parsed.intentScore
        }
      }]);

    if (intError) throw intError;
    console.log("✅ Customer Interaction CRM'e başarıyla yazıldı!");

    // Temizlik: Test kaydını geri silelim ki veritabanı kirlenmesin
    await supabase.from('customer_interactions').delete().eq('lead_id', insertedLead.id);
    await supabase.from('leads').delete().eq('id', insertedLead.id);
    console.log("🧹 Test kayıtları temizlendi.");
    console.log("✅ Müzakere & CRM Entegrasyon Testi: BAŞARILI");

  } catch (e) {
    console.error("❌ Müzakere & CRM Entegrasyon hatası:", e.message);
  }
}

async function runAllTests() {
  console.log("=================================================");
  console.log("💥 QUANTUM OS AI & OTOMASYON BRUTAL HARD-TESTİ 💥");
  console.log("=================================================");
  await testTranslation();
  await testLeadEvaluation();
  await testLegalCompliance();
  await testNegotiationAndCRM();
  console.log("\n=================================================");
  console.log("🎉 BRUTAL HARD-TEST TAMAMLANDI");
  console.log("=================================================");
}

runAllTests();
