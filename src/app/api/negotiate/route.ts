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
    const { propertyId, message, offerAmount, name, phone, history } = await request.json();

    if (!propertyId || !message) {
      return NextResponse.json({ error: 'Eksik parametre' }, { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. İlan bilgilerini çekelim
    const { data: prop } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (!prop) {
      return NextResponse.json({ error: 'İlan bulunamadı' }, { status: 404, headers: corsHeaders });
    }

    const listPrice = Number(prop.price || 0);

    // 2. Gemini AI Müzakere Promptunu hazırlayalım
    const prompt = `
      Sen Kaynak Gayrimenkul'ün lüks konut uzmanı, son derece seçkin ve akıllı bir AI Gayrimenkul Müzakerecisisin.
      Mülk Bilgileri:
      - Başlık: ${prop.title}
      - Konum: Ankara / ${prop.district_id}
      - Liste Fiyatı: ${listPrice.toLocaleString('tr-TR')} TL
      - Özellikler: ${prop.rooms} Oda, ${prop.sqm} m²
      
      Alıcı Bilgileri:
      - İsim: ${name || 'Misafir Alıcı'}
      - Telefon: ${phone || 'Girilmedi'}
      - Alıcının Teklif Ettiği Tutar: ${offerAmount ? offerAmount.toLocaleString('tr-TR') + ' TL' : 'Henüz belirtilmedi'}
      
      Müzakere Kuralları:
      1. Son derece lüks, profesyonel, nazik ama sıkı bir müzakereci ol. "Kaynak Gayrimenkul standartlarında" konuş.
      2. Eğer alıcı liste fiyatının çok altında (örn: %20'den daha düşük) bir teklif verirse, bu teklifin mülkün lüks değeriyle uyuşmadığını kibarca belirt ama kapıyı kapatma ("Mülk sahibimiz bu portföyün benzersizliğine ve değerine çok inanıyor, ancak teklifinizi ciddi alıcı profilinizle birlikte mülk sahibimize iletmem için sizi detaylı görüşmeye davet edebilirim" de).
      3. Alıcının niyet seviyesini ve psikolojisini analiz et.
      4. JSON formatında hem alıcıya yazacağın cevabı, hem de broker/danışman için alıcının niyet skorunu (0-100), intent level (VIP, HOT, WARM, COLD) ve alıcının maksimum bütçe tahminini içeren bir analiz üret.
      
      Önceki Mesaj Geçmişi:
      ${JSON.stringify(history)}
      
      Alıcının Son Mesajı: "${message}"
      
      MUTLAKA sadece aşağıdaki şablonda saf bir JSON objesi dön:
      {
        "reply": "Alıcıya iletilecek profesyonel, lüks müzakereci cevabı metni...",
        "intentScore": 85,
        "intentLevel": "VIP",
        "predictedMaxBudget": "14500000",
        "summary": "Müşteri mülk için 12.000.000 TL teklif verdi, nakit alım yapmak istiyor."
      }
    `;

    // Direct REST API Call to Gemini - Zero Dependencies!
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY?.trim()}`;
    
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

    // 3. Eğer alıcı iletişim bilgilerini (isim ve telefon) girmişse, CRM leads tablosuna GERÇEK bir lead kaydı düşelim.
    if (name && phone) {
      const { data: insertedLead } = await supabase
        .from('leads')
        .insert([{
          name,
          phone,
          property_id: propertyId,
          score: parsedResult.intentScore || 50,
          intent_level: parsedResult.intentLevel || 'WARM',
          source: 'AI Müzakereci',
          message: `[AI Müzakere Özeti] ${parsedResult.summary || ''} | Tahmini Maks. Bütçe: ${Number(parsedResult.predictedMaxBudget || 0).toLocaleString('tr-TR')} TL. Alıcının Son Teklifi: ${offerAmount ? offerAmount.toLocaleString('tr-TR') : 'Belirtilmedi'} TL.`
        }])
        .select('id')
        .single();

      if (insertedLead?.id) {
        // Müşteri Etkileşim Zaman Tüneline (Omnichannel Lead Bus) Kaydedelim
        await supabase
          .from('customer_interactions')
          .insert([{
            lead_id: insertedLead.id,
            event_type: 'negotiation_offer',
            details: {
              property_id: propertyId,
              offer_amount: offerAmount || null,
              buyer_message: message,
              ai_reply: parsedResult.reply,
              intent_score: parsedResult.intentScore,
              predicted_max_budget: parsedResult.predictedMaxBudget
            }
          }]);
      }
    }

    return NextResponse.json(parsedResult, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
