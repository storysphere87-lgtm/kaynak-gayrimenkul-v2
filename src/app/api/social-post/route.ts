import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limiter';
import { callAI, safeParseJSON } from '@/lib/ai-gateway';

export async function POST(request: Request) {
  // ─── Rate Limiting ──────────────────────────────────────────────────────────
  const ip = getClientIP(request);
  const rateResult = checkRateLimit(ip, 'socialPost', RATE_LIMITS.socialPost);
  if (!rateResult.allowed) {
    return NextResponse.json(
      { error: 'Çok fazla istek gönderildi. Lütfen bir dakika bekleyin.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rateResult.resetAt - Date.now()) / 1000)) },
      }
    );
  }

  try {
    const body = await request.json();
    const { propertyId } = body;

    const { data: prop, error } = await supabase
      .from('properties')
      .select('*, districts(name)')
      .eq('id', propertyId)
      .single();

    if (error || !prop) throw new Error('İlan bulunamadı.');

    const formattedPrice = Number(prop.price).toLocaleString('tr-TR');
    const districtName   = prop.districts?.name || 'Etimesgut';

    const defaultMarketing = {
      caption_tr:   `🏡 Ankara ${districtName}'te Lüks Yaşam Yeniden Tanımlanıyor!\n\n✨ ${prop.title} | ${prop.rooms} | ${prop.sqm} m²\n💰 Fiyat: ₺${formattedPrice}\n\nDetaylar ve randevu için bizimle iletişime geçin. #kaynakgayrimenkul #lükskonut #ankaraemlak`,
      caption_en:   `🏡 Luxury Living Redefined in Ankara ${districtName}!\n\n✨ ${prop.title_en || prop.title} | ${prop.rooms} | ${prop.sqm} sqm\n💰 Price: ₺${formattedPrice}\n\nContact us for details. #luxuryrealestate #ankarahomes`,
      caption_ar:   `🏡 إعادة تعريف معايير المعيشة الفاخرة في أنقرة ${districtName}!\n\n✨ ${prop.title_ar || prop.title} | ${prop.rooms} | ${prop.sqm} م²\n💰 السعر: ₺${formattedPrice}\n\nتواصل معنا للمزيد من التفاصيل.`,
      image_prompt: `High-end luxury modern architectural photography of a premium villa/apartment building in Ankara, Turkey. Golden hour lighting, elegant concrete and glass elements, warm interior lights, ultra-high resolution cinematic photorealistic render.`,
    };

    const SOCIAL_SCHEMA = {
      type: 'OBJECT' as const,
      properties: {
        caption_tr:   { type: 'string' },
        caption_en:   { type: 'string' },
        caption_ar:   { type: 'string' },
        image_prompt: { type: 'string' },
      },
      required: ['caption_tr', 'caption_en', 'caption_ar', 'image_prompt'],
    };

    const prompt = `
Sen "Kaynak Gayrimenkul Quantum OS" sisteminin kıdemli dijital pazarlama yapay zekasısın.
Aşağıdaki mülk bilgilerini kullanarak:
1. Instagram/LinkedIn için lüks dilde Türkçe (caption_tr), İngilizce (caption_en) ve Arapça (caption_ar) pazarlama metinleri oluştur.
2. Mülk için foto-realistik, sinematik, lüks bir mimari görsel oluşturma İngilizce promptu (image_prompt) yaz.

Mülk Bilgileri:
- Başlık: ${prop.title}
- Bölge: Ankara / ${districtName}
- Fiyat: ${formattedPrice} TL
- Oda Sayısı: ${prop.rooms}
- Alan: ${prop.sqm} m²
- Açıklama: ${prop.description}
`.trim();

    const aiText = await callAI(prompt, SOCIAL_SCHEMA);
    const result = safeParseJSON(aiText ?? '{}', defaultMarketing);

    return NextResponse.json({
      success:      true,
      caption_tr:   result.caption_tr   || defaultMarketing.caption_tr,
      caption_en:   result.caption_en   || defaultMarketing.caption_en,
      caption_ar:   result.caption_ar   || defaultMarketing.caption_ar,
      image_prompt: result.image_prompt || defaultMarketing.image_prompt,
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
