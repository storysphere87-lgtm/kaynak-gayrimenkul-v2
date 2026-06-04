import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ─── Singleton istemciler — modül yüklendiğinde bir kez oluşturulur ─────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  // ─── API Key Koruması ──────────────────────────────────────────────────────
  // Supabase Webhook'larından gelen istekleri doğrula
  const apiKey = request.headers.get('x-api-key');
  if (apiKey !== process.env.INGEST_API_KEY) {
    return NextResponse.json({ error: 'Yetkisiz Erişim' }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (body.type !== 'INSERT' || !body.record) {
      return NextResponse.json({ error: 'Sadece INSERT tetikleyicileri kabul edilir.' }, { status: 400 });
    }

    const property = body.record;
    console.log(`[Quantum Webhook] Yeni ilan tespit edildi: ${property.id}`);

    // 1. Görselleri indir ve Supabase Storage'a yedekle
    let newImageUrls = property.images || [];

    if (newImageUrls.length > 0 && newImageUrls[0].includes('http')) {
      const updatedUrls: string[] = [];

      for (let i = 0; i < newImageUrls.length; i++) {
        try {
          const imgUrl = newImageUrls[i];
          if (imgUrl.includes('supabase.co')) { updatedUrls.push(imgUrl); continue; }

          const response = await fetch(imgUrl);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);

          const arrayBuffer = await response.arrayBuffer();
          const buffer      = Buffer.from(arrayBuffer);
          const ext         = imgUrl.split('.').pop()?.split('?')[0] || 'jpg';
          const filename    = `${property.id}/image_${i}.${ext}`;

          const { error } = await supabase.storage
            .from('property-images')
            .upload(filename, buffer, {
              contentType: response.headers.get('content-type') || 'image/jpeg',
              upsert: true,
            });

          if (error) {
            updatedUrls.push(imgUrl);
          } else {
            const { data: publicData } = supabase.storage.from('property-images').getPublicUrl(filename);
            updatedUrls.push(publicData.publicUrl);
          }
        } catch (imgError) {
          console.error(`[Webhook] Görsel işleme hatası (${i}):`, imgError);
          updatedUrls.push(newImageUrls[i]);
        }
      }
      newImageUrls = updatedUrls;
    }

    // 2. Başlık ve Açıklamayı Gemini ile çevir
    let title_en = '', description_en = '', title_ar = '', description_ar = '';

    try {
      const model  = genAI.getGenerativeModel({ model: GEMINI_MODEL });
      const prompt = `
Sen lüks bir gayrimenkul pazarlama uzmanısın. Aşağıdaki Türkçe emlak ilanının başlığını ve açıklamasını, lüks bir tonla İngilizce ve Arapça'ya çevir.
JSON formatında tam olarak şu yapıda yanıt ver:
{
  "title_en": "English title here",
  "description_en": "English description here",
  "title_ar": "Arabic title here",
  "description_ar": "Arabic description here"
}

TÜRKÇE İLAN BAŞLIĞI: ${property.title}
TÜRKÇE İLAN AÇIKLAMASI: ${property.description || 'Açıklama yok.'}
`.trim();

      const aiResult     = await model.generateContent(prompt);
      const responseText = aiResult.response.text();

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const translated = JSON.parse(jsonMatch[0]);
        title_en       = translated.title_en;
        description_en = translated.description_en;
        title_ar       = translated.title_ar;
        description_ar = translated.description_ar;
      }
    } catch (aiError) {
      console.error(`[Webhook] Yapay Zeka Çeviri Hatası:`, aiError);
    }

    // 3. Supabase'i güncelle
    const { error: updateError } = await supabase
      .from('properties')
      .update({
        images:        newImageUrls,
        title_en:      title_en      || null,
        description_en: description_en || null,
        title_ar:      title_ar      || null,
        description_ar: description_ar || null,
      })
      .eq('id', property.id);

    if (updateError) {
      return NextResponse.json({ error: 'Güncelleme yapılamadı' }, { status: 500 });
    }

    return NextResponse.json({ success: true, processed: true });

  } catch (err: any) {
    console.error('[Quantum Webhook] Sistem Hatası:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
