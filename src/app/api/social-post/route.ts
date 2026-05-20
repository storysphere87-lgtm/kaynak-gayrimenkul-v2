import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { propertyId } = body;

    // 1. İlan bilgilerini çekelim
    const { data: prop, error } = await supabase
      .from('properties')
      .select('*, districts(name)')
      .eq('id', propertyId)
      .single();

    if (error || !prop) throw new Error('İlan bulunamadı.');

    // 2. Sistem AI Key'ini alalım
    const { data: settings } = await supabase.from('settings').select('*');
    const apiKey = settings?.find(s => s.key === 'ai_api_key')?.value;

    const formattedPrice = Number(prop.price).toLocaleString('tr-TR');
    const districtName = prop.districts?.name || 'Etimesgut';

    const defaultMarketing = {
      caption_tr: `🏡 Ankara ${districtName}'te Lüks Yaşam Yeniden Tanımlanıyor!\n\n✨ ${prop.title} | ${prop.rooms} | ${prop.sqm} m²\n💰 Fiyat: ₺${formattedPrice}\n\nDetaylar ve randevu için bizimle iletişime geçin. #kaynakgayrimenkul #lükskonut #ankaraemlak`,
      caption_en: `🏡 Luxury Living Redefined in Ankara ${districtName}!\n\n✨ ${prop.title_en || prop.title} | ${prop.rooms} | ${prop.sqm} sqm\n💰 Price: ₺${formattedPrice}\n\nContact us for details. #luxuryrealestate #ankarahomes`,
      caption_ar: `🏡 إعادة تعريف معايير المعيشة الفاخرة في أنقرة ${districtName}!\n\n✨ ${prop.title_ar || prop.title} | ${prop.rooms} | ${prop.sqm} م²\n💰 السعر: ₺${formattedPrice}\n\nتواصل معنا للمزيد من التفاصيل.`,
      image_prompt: `High-end luxury modern architectural photography of a premium villa/apartment building in Ankara, Turkey. Golden hour lighting, elegant concrete and glass elements, warm interior lights showing through windows, ultra-high resolution cinematic photorealistic render.`
    };

    if (!apiKey) {
      return NextResponse.json({ success: true, ...defaultMarketing });
    }

    // 3. Gemini ile ultra-premium otonom sosyal medya sunumu & DALL-E Promtu hazırlayalım
    const prompt = `
      Sen "Kaynak Gayrimenkul Quantum OS" sisteminin kıdemli dijital pazarlama ve sosyal medya yapay zekasısın.
      Aşağıdaki mülk bilgilerini kullanarak:
      1. Instagram/LinkedIn için lüks dilde Türkçe (caption_tr), İngilizce (caption_en) ve Arapça (caption_ar) pazarlama metinleri oluştur. Etiketler (#) ekle.
      2. Mülk için DALL-E 3 veya Midjourney ile üretilebilecek, foto-realistik, sinematik, son derece lüks bir mimari görsel oluşturma İngilizce promptu (image_prompt) yaz.
      
      Mülk Bilgileri:
      - Başlık: ${prop.title}
      - Bölge: Ankara / ${districtName}
      - Fiyat: ${formattedPrice} TL
      - Oda Sayısı: ${prop.rooms}
      - Alan: ${prop.sqm} m²
      - Açıklama: ${prop.description}
      
      Lütfen sadece geçerli bir JSON objesi döndür, markdown veya başka bir metin kullanma.
      Format:
      {
        "caption_tr": "metin...",
        "caption_en": "metin...",
        "caption_ar": "metin...",
        "image_prompt": "prompt..."
      }
    `;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      const jsonStr = aiText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
      const result = JSON.parse(jsonStr);

      return NextResponse.json({
        success: true,
        caption_tr: result.caption_tr || defaultMarketing.caption_tr,
        caption_en: result.caption_en || defaultMarketing.caption_en,
        caption_ar: result.caption_ar || defaultMarketing.caption_ar,
        image_prompt: result.image_prompt || defaultMarketing.image_prompt
      });
    } catch (e) {
      console.error("AI Social Post generator failed, falling back to default.", e);
      return NextResponse.json({ success: true, ...defaultMarketing });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
