import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limiter';
import { callAI, safeParseJSON } from '@/lib/ai-gateway';

const ALLOWED_ORIGINS = [
  'https://kaynakgayrimenkul.com',
  'https://www.kaynakgayrimenkul.com',
  'http://localhost:3000',
  'http://localhost:3001',
];

function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin') ?? '';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin':  allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function OPTIONS(request: Request) {
  return NextResponse.json({}, { headers: getCorsHeaders(request) });
}

export async function POST(request: Request) {
  const corsHeaders = getCorsHeaders(request);

  // ─── Rate Limiting ────────────────────────────────────────────────────────
  const ip = getClientIP(request);
  const rateResult = checkRateLimit(ip, 'personalizedOffer', RATE_LIMITS.personalizedOffer);
  if (!rateResult.allowed) {
    return NextResponse.json(
      { error: 'Çok fazla istek gönderildi. Lütfen bir dakika bekleyin.' },
      {
        status: 429,
        headers: {
          ...corsHeaders,
          'Retry-After': String(Math.ceil((rateResult.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  try {
    const { name, phone, budget, rooms, district, lifestyle } = await request.json();

    if (!name || !phone || !budget) {
      return NextResponse.json({ error: 'Eksik parametre' }, { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Veritabanındaki tüm aktif portföyleri çek
    const { data: properties, error: dbError } = await supabase
      .from('properties')
      .select('*, districts(name)')
      .eq('status', 'aktif');

    if (dbError || !properties) {
      throw new Error(dbError?.message || 'Portföyler çekilemedi');
    }

    // 2. Müşteri kriterlerine göre puanlama
    const scoredProperties = properties.map((p: any) => {
      let score = 100;

      const priceDiff = p.price - Number(budget);
      if (priceDiff > 0) score -= Math.min(50, (priceDiff / 1000000) * 10);

      if (district && p.district_id?.toLowerCase() === district.toLowerCase()) score += 30;
      if (rooms    && p.rooms?.includes(rooms))                                  score += 20;

      return { ...p, matchScore: score };
    });

    const matchedProperties = scoredProperties
      .sort((a: any, b: any) => b.matchScore - a.matchScore)
      .slice(0, 3);

    // 3. AI ile kişiye özel teklif metni
    const OFFER_SCHEMA = {
      type: 'OBJECT' as const,
      properties: {
        intro:      { type: 'string' },
        matches:    {
          type: 'ARRAY' as const,
          items: {
            type: 'OBJECT' as const,
            properties: {
              id:     { type: 'string' },
              reason: { type: 'string' },
            },
            required: ['id', 'reason'],
          },
        },
        conclusion: { type: 'string' },
      },
      required: ['intro', 'matches', 'conclusion'],
    };

    const prompt = `
Sen Kaynak Gayrimenkul'ün Baş Broker'ı ve "Quantum AI Yatırım Danışmanı"sın.
Aşağıdaki profildeki seçkin alıcı için en uygun 3 mülkü belirledik.

Müşteri Profili:
- İsim: ${name}
- Maksimum Bütçe: ${Number(budget).toLocaleString('tr-TR')} TL
- Yaşam Tarzı Tercihi: ${lifestyle || 'Lüks Konut / Aile Yaşamı'}
- Aradığı Bölge: ${district || 'Belirtilmedi'}
- Aradığı Oda Sayısı: ${rooms || 'Belirtilmedi'}

Önerilen 3 Portföy:
${matchedProperties.map((p: any, i: number) => `
${i + 1}. Portföy:
- ID: ${p.id}
- Başlık: ${p.title}
- Konum: Ankara / ${p.districts?.name || p.district_id}
- Fiyat: ${p.price.toLocaleString('tr-TR')} TL
- Özellikler: ${p.rooms} Oda, ${p.sqm} m²`).join('\n')}

Görevlerin:
1. Müşteriye hitaben çok seçkin, saygın ve lüks bir giriş mektubu yaz.
2. Her mülk için "Neden Bu Mülk?" gerekçesi hazırla.
3. Kısa bir kapanış paragrafı ekle.
`.trim();

    const defaultAnalysis = { intro: '', matches: [], conclusion: '' };
    const aiText = await callAI(prompt, OFFER_SCHEMA);
    const parsedResult = safeParseJSON(aiText ?? '{}', defaultAnalysis);

    // 4. CRM kaydı
    const { data: insertedLead } = await supabase
      .from('leads')
      .insert([{
        full_name:    name,
        phone,
        score:        95,
        intent_level: 'VIP',
        source:       'Kişisel AI Teklifi',
        message:      `[Kişisel Teklif Broşürü] Bölge: ${district || 'Her yer'}, Bütçe: ${Number(budget).toLocaleString('tr-TR')} TL. Mülkler: ${matchedProperties.map((p: any) => p.title).join(' | ')}`,
      }])
      .select('id')
      .single();

    if (insertedLead?.id) {
      await supabase.from('customer_interactions').insert([{
        lead_id:    insertedLead.id,
        event_type: 'personalized_offer_generated',
        details: {
          budget,
          rooms:                  rooms || null,
          district:               district || null,
          lifestyle:              lifestyle || null,
          matched_property_ids:   matchedProperties.map((p: any) => p.id),
          ai_brochure:            parsedResult,
        },
      }]);
    }

    return NextResponse.json({ success: true, analysis: parsedResult, properties: matchedProperties }, { headers: corsHeaders });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
