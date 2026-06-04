import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { pingGoogleSitemap } from '@/lib/seo-ping';
import * as fs from 'fs';
import * as path from 'path';
import dns from 'dns';
import { callAI, safeParseJSON } from '@/lib/ai-gateway';

dns.setDefaultResultOrder('ipv4first');

export async function GET(request: Request) {
  // ─── API Key Koruması ────────────────────────────────────────────────────────
  // Bu endpoint yalnızca INGEST_API_KEY ile çağrılabilir.
  const apiKey = request.headers.get('x-api-key');
  if (apiKey !== process.env.INGEST_API_KEY) {
    return NextResponse.json({ error: 'Yetkisiz Erişim' }, { status: 401 });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: stats, error: statsError } = await supabase
      .from('market_stats')
      .select('*')
      .order('created_at', { ascending: false });

    if (statsError || !stats || stats.length === 0) {
      throw new Error(statsError?.message || 'Piyasa istatistik verileri bulunamadı.');
    }

    const latestMonth = stats[0].month_year;

    const SEO_SCHEMA = {
      type: 'OBJECT' as const,
      properties: {
        title:        { type: 'string' },
        slug:         { type: 'string' },
        month:        { type: 'string' },
        content_html: { type: 'string' },
      },
      required: ['title', 'slug', 'month', 'content_html'],
    };

    const prompt = `
Sen Kaynak Gayrimenkul'ün baş veri analisti ve emlak piyasa uzmanı yapay zekasısın.
Aşağıdaki ham TÜİK gayrimenkul verilerini analiz et ve Ankara lüks konut piyasasına yönelik
SEO uyumlu, zengin içerikli profesyonel bir piyasa değerlendirme makalesi yaz.

HAM PİYASA VERİLERİ (${latestMonth}):
${stats.map((s: any) => `- ${s.district_name}: Aylık Satış: ${s.sales_volume} Adet | Fiyat Değişimi: %${s.price_index_change} | Ort. m²: ${s.average_sqm_price} TL`).join('\n')}

YAZI KURALLARI:
1. Başlık çarpıcı ve SEO uyumlu olmalıdır.
2. HTML formatında (h2, h3, p, strong, ul, li etiketleri) zengin içerik üret.
3. Her bölgeyi veri odaklı yorumla, yatırımcılara tavsiyeler ver.
4. slug: küçük harf, tire ile bağlı, Türkçe karakter içermemeli.
`.trim();

    const aiText = await callAI(prompt, SEO_SCHEMA);
    if (!aiText) throw new Error('AI yanıt üretemedi');

    const parsedResult = safeParseJSON(aiText, { title: '', slug: '', month: latestMonth, content_html: '' });

    // Yerel JSON ambarına kaydet
    const filePath = path.join(process.cwd(), 'src', 'config', 'market_stories.json');
    let existingStories: any[] = [];

    if (fs.existsSync(filePath)) {
      try {
        const rawData = fs.readFileSync(filePath, 'utf-8');
        existingStories = JSON.parse(rawData);
      } catch { existingStories = []; }
    }

    const existingIndex = existingStories.findIndex((s: any) => s.month === latestMonth);
    if (existingIndex > -1) {
      existingStories[existingIndex] = parsedResult;
    } else {
      existingStories.unshift(parsedResult);
    }

    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(existingStories, null, 2), 'utf-8');

    await pingGoogleSitemap();

    return NextResponse.json({ success: true, story: parsedResult });

  } catch (error: any) {
    console.error('[Quantum SEO] Sistem Hatası:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
