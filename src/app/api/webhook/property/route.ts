import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Supabase with Service Role to bypass RLS for background processing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Check if this is an INSERT event from Supabase Webhooks
    if (body.type !== 'INSERT' || !body.record) {
      return NextResponse.json({ error: 'Sadece INSERT tetikleyicileri kabul edilir.' }, { status: 400 });
    }

    const property = body.record;
    console.log(`[Quantum Webhook] Yeni ilan tespit edildi: ${property.id}`);

    // 1. Download images and upload to Supabase Storage
    let newImageUrls = property.images || [];
    
    // Only process if it has images and they are external (Sahibinden) links
    if (newImageUrls.length > 0 && newImageUrls[0].includes('http')) {
      console.log(`[Quantum Webhook] Görseller indiriliyor ve Storage'a yedekleniyor...`);
      const updatedUrls = [];
      
      for (let i = 0; i < newImageUrls.length; i++) {
        try {
          const imgUrl = newImageUrls[i];
          // Bazı URL'ler base64 veya zaten storage URL'si olabilir, kontrol et
          if (imgUrl.includes('supabase.co')) {
            updatedUrls.push(imgUrl);
            continue;
          }

          const response = await fetch(imgUrl);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          // Benzersiz dosya adı oluştur
          const ext = imgUrl.split('.').pop()?.split('?')[0] || 'jpg';
          const filename = `${property.id}/image_${i}.${ext}`;

          const { data, error } = await supabase.storage
            .from('property-images')
            .upload(filename, buffer, {
              contentType: response.headers.get('content-type') || 'image/jpeg',
              upsert: true
            });

          if (error) {
            console.error(`Görsel yükleme hatası: ${error.message}`);
            updatedUrls.push(imgUrl); // Hata olursa eski linki tut
          } else {
            // Public URL'i al
            const { data: publicData } = supabase.storage.from('property-images').getPublicUrl(filename);
            updatedUrls.push(publicData.publicUrl);
          }
        } catch (imgError) {
          console.error(`Görsel işleme hatası (${i}):`, imgError);
          updatedUrls.push(newImageUrls[i]); // Hata olursa orjinali tut
        }
      }
      newImageUrls = updatedUrls;
    }

    // 2. Translate Title and Description with Gemini AI
    console.log(`[Quantum Webhook] Gemini AI ile otonom çeviri başlatılıyor...`);
    let title_en = '', description_en = '', title_ar = '', description_ar = '';
    
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // Use flash for speed
      
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
      `;

      const aiResult = await model.generateContent(prompt);
      const responseText = aiResult.response.text();
      
      // JSON'u ayıkla (Markdown code block içinde gelme ihtimaline karşı)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const translated = JSON.parse(jsonMatch[0]);
        title_en = translated.title_en;
        description_en = translated.description_en;
        title_ar = translated.title_ar;
        description_ar = translated.description_ar;
      }
    } catch (aiError) {
      console.error(`Yapay Zeka Çeviri Hatası:`, aiError);
    }

    // 3. Update the property record in Supabase
    console.log(`[Quantum Webhook] Veritabanı yeni verilerle güncelleniyor...`);
    const { error: updateError } = await supabase
      .from('properties')
      .update({
        images: newImageUrls,
        title_en: title_en || null,
        description_en: description_en || null,
        title_ar: title_ar || null,
        description_ar: description_ar || null
      })
      .eq('id', property.id);

    if (updateError) {
      console.error(`Güncelleme hatası:`, updateError);
      return NextResponse.json({ error: 'Güncelleme yapılamadı' }, { status: 500 });
    }

    console.log(`[Quantum Webhook] İlan başarıyla otonom hale getirildi! (${property.id})`);
    return NextResponse.json({ success: true, processed: true });

  } catch (err: any) {
    console.error('[Quantum Webhook] Sistem Hatası:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
