import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { pingGoogleSitemap } from '@/lib/seo-ping';
import * as fs from 'fs';
import * as path from 'path';
import dns from 'dns';

// Force Node.js to prefer IPv4 over broken IPv6 network routes (avoids ConnectTimeoutError)
dns.setDefaultResultOrder('ipv4first');

export async function GET(request: Request) {
  try {
    // 1. Supabase Servis Rolü ile Bağlan
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 2. Güncel TÜİK Piyasa İstatistiklerini Çek
    const { data: stats, error: statsError } = await supabase
      .from('market_stats')
      .select('*')
      .order('created_at', { ascending: false });

    if (statsError || !stats || stats.length === 0) {
      throw new Error(statsError?.message || 'Piyasa istatistik verileri bulunamadı.');
    }

    const latestMonth = stats[0].month_year;
    
    // 3. Gemini 2.5 Flash ile Otonom SEO Makalesi Sentezle
    const prompt = `
      Sen Kaynak Gayrimenkul'ün baş veri analisti ve emlak piyasa uzmanı yapay zekasısın.
      Aşağıdaki ham TÜİK gayrimenkul verilerini analiz et ve Ankara lüks konut piyasasına yönelik 
      harika, zengin içerikli, tamamen SEO uyumlu (Google'da üst sıralara çıkacak) profesyonel bir piyasa değerlendirme makalesi yaz.
      
      HAM PİYASA VERİLERİ (${latestMonth}):
      ${stats.map(s => `- ${s.district_name} Bölgesi: Aylık Konut Satışı: ${s.sales_volume} Adet | Fiyat Değişimi: %${s.price_index_change} | Ortalama m² Birim Fiyatı: ${s.average_sqm_price} TL`).join('\n')}
      
      YAZI KURALLARI:
      1. Başlık mutlaka çarpıcı ve SEO uyumlu olmalıdır (Örn: "Ankara Lüks Konut Piyasası ${latestMonth} Analizi: Hangi Bölge Kazandırıyor?").
      2. Giriş, Gelişme ve Sonuç bölümlerinden oluşmalıdır. HTML formatında (h2, h3, p, strong, ul, li etiketleri kullanarak) biçimlendirilmiş zengin bir içerik üret.
      3. Her bir bölgeyi (Çankaya, Gölbaşı, Etimesgut, Yenimahalle vb.) veri odaklı yorumla. Yatırımcılara ve ev satmak isteyenlere tavsiyeler ver.
      4. Çıktıyı MUTLAKA sadece aşağıdaki şablonda geçerli bir JSON olarak ver, başka hiçbir açıklama ekleme:
      {
        "title": "SEO Uyumlu Başlık Yazısı...",
        "slug": "ankara-luks-konut-piyasasi-mayis-2026-degerlendirmesi",
        "month": "${latestMonth}",
        "content_html": "<h2>Giriş...</h2><p>Ankara genelinde konut satışları...</p>..."
      }
    `;

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
      const errBody = await response.json().catch(() => ({}));
      throw new Error(`Gemini API Hatası: ${response.statusText} - ${JSON.stringify(errBody)}`);
    }

    const resData = await response.json();
    const resultText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsedResult = JSON.parse(resultText || '{}');

    // 4. Makaleyi Yerel JSON Veri Ambarına (config/market_stories.json) Kaydet (Hızlı Okuma İçin)
    const filePath = path.join(process.cwd(), 'src', 'config', 'market_stories.json');
    
    let existingStories = [];
    if (fs.existsSync(filePath)) {
      try {
        const rawData = fs.readFileSync(filePath, 'utf-8');
        existingStories = JSON.parse(rawData);
      } catch (e) {
        existingStories = [];
      }
    }

    // Eğer bu aya ait yazı zaten varsa güncelle, yoksa ekle
    const existingIndex = existingStories.findIndex((s: any) => s.month === latestMonth);
    if (existingIndex > -1) {
      existingStories[existingIndex] = parsedResult;
    } else {
      existingStories.unshift(parsedResult); // En yeni yazıyı en başa ekle
    }

    // Klasör yoksa oluştur
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(existingStories, null, 2), 'utf-8');
    console.log(`[Quantum SEO] Otonom Piyasa Raporu Başarıyla Yazıldı: ${parsedResult.title}`);

    // 5. Otonom Sitemap Pingleme ile Google Botlarını Anında Uyar!
    await pingGoogleSitemap();

    return NextResponse.json({
      success: true,
      message: 'Otonom SEO makalesi başarıyla üretildi ve Google botları uyarıldı.',
      story: parsedResult
    });

  } catch (error: any) {
    console.error('[Quantum SEO] Sistem Hatası:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
