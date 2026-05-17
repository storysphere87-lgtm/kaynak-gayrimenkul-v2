import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const { name, phone, budget, rooms, district, lifestyle } = await request.json();

    if (!name || !phone || !budget) {
      return NextResponse.json({ error: 'Eksik parametre' }, { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Veritabanındaki tüm aktif portföyleri çekelim
    const { data: properties, error: dbError } = await supabase
      .from('properties')
      .select('*, districts(name)')
      .eq('status', 'aktif');

    if (dbError || !properties) {
      throw new Error(dbError?.message || 'Portföyler çekilemedi');
    }

    // 2. Müşteri kriterlerine göre puanlama yapıp en uygun adayları seçen gerçek algoritma
    const scoredProperties = properties.map((p: any) => {
      let score = 100;
      
      // Bütçe uyumu cezası (Bütçeyi aşan her 1M TL için puan kır)
      const priceDiff = p.price - Number(budget);
      if (priceDiff > 0) {
        score -= Math.min(50, (priceDiff / 1000000) * 10);
      }

      // Bölge uyumu ödülü (+30 puan)
      if (district && p.district_id?.toLowerCase() === district.toLowerCase()) {
        score += 30;
      }

      // Oda sayısı uyumu ödülü (+20 puan)
      if (rooms && p.rooms?.includes(rooms)) {
        score += 20;
      }

      return { ...p, matchScore: score };
    });

    // En yüksek puanlı 3 mülkü seçelim
    const matchedProperties = scoredProperties
      .sort((a: any, b: any) => b.matchScore - a.matchScore)
      .slice(0, 3);

    // 3. Gemini AI ile kişiye özel lüks sunum metinlerini hazırlayalım
    const prompt = `
      Sen Kaynak Gayrimenkul'ün Baş Broker'ı ve yapay zeka tabanlı "Quantum AI Yatırım ve Lüks Konut Danışmanı"sın.
      Aşağıdaki profildeki seçkin alıcımız için en uygun 3 mülkü belirledik. 
      Alıcı için son derece zengin, ikna edici, gerekçeli ve lüks bir teklif mektubu yazacaksın.
      
      Müşteri Profili:
      - İsim: ${name}
      - Telefon: ${phone}
      - Maksimum Bütçe: ${Number(budget).toLocaleString('tr-TR')} TL
      - Yaşam Tarzı Tercihi: ${lifestyle || 'Lüks Konut / Aile Yaşamı'}
      - Aradığı Bölge: ${district || 'Belirtilmedi'}
      - Aradığı Oda Sayısı: ${rooms || 'Belirtilmedi'}
      
      Önerilen 3 Portföy:
      ${matchedProperties.map((p, i) => `
      ${i + 1}. Portföy:
      - Başlık: ${p.title}
      - Konum: Ankara / ${p.districts?.name || p.district_id}
      - Fiyat: ${p.price.toLocaleString('tr-TR')} TL
      - Özellikler: ${p.rooms} Oda, ${p.sqm} m²
      - Görsel: ${p.images?.[0] || 'Görsel Yok'}
      `).join('\n')}
      
      Görevlerin:
      1. Müşteriye hitaben çok seçkin, saygın ve lüks bir giriş mektubu yaz.
      2. Önerilen 3 mülkün HER BİRİ için bu müşterinin kriterleriyle (bütçe, yaşam tarzı, ROI vb.) nasıl birebir eşleştiğini açıklayan, "Neden Bu Mülk?" başlığı altında özel birer gerekçelendirme paragrafı hazırla.
      3. Çıktıyı MUTLAKA saf bir JSON objesi olarak ver. Başka hiçbir açıklama ekleme.
      
      Şablon:
      {
        "intro": "Sayın Ahmet Yılmaz, Kaynak Gayrimenkul lüks konut ekosistemine hoş geldiniz...",
        "matches": [
          {
            "id": "birinci_mulk_id",
            "reason": "Bu mülk Çankaya'da olup, bütçenizi zorlamadan size prestijli bir aile yaşamı sunuyor..."
          },
          {
            "id": "ikinci_mulk_id",
            "reason": "Yatırım odağınızla birebir örtüşen bu portföy, yüksek amortisman gücüyle..."
          },
          {
            "id": "ucuncu_mulk_id",
            "reason": "Metrekare büyüklüğü ve oda yerleşimi tam da aradığınız..."
          }
        ],
        "conclusion": "Size bu özel alternatifleri canlı olarak gezdirmekten onur duyarız..."
      }
    `;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini REST API Hatası: ${response.statusText}`);
    }

    const resData = await response.json();
    const resultText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsedResult = JSON.parse(resultText || '{}');

    // 4. CRM leads tablosuna "Kişisel Teklif Talebi" olarak kaydedelim
    await supabase
      .from('leads')
      .insert([{
        name,
        phone,
        score: 95, // Otomatik yüksek VIP skoru
        intent_level: 'VIP',
        source: 'Kişisel AI Teklifi',
        message: `[Kişisel Teklif Broşürü Hazırlandı] Tercihler: Bölge: ${district || 'Her yer'}, Bütçe: ${Number(budget).toLocaleString('tr-TR')} TL, Yaşam Tarzı: ${lifestyle || 'Belirtilmedi'}. Eşleşen mülkler: ${matchedProperties.map(p => p.title).join(' | ')}`
      }]);

    return NextResponse.json({
      success: true,
      analysis: parsedResult,
      properties: matchedProperties
    }, { headers: corsHeaders });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
