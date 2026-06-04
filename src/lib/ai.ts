/**
 * Kaynak Gayrimenkul Quantum OS - AI İş Mantığı Modülü
 *
 * Bu dosya sadece prompt oluşturma ve iş mantığından sorumludur.
 * Tüm AI çağrıları merkezi ai-gateway.ts üzerinden yapılır:
 *  - API key yönetimi   → ai-gateway.ts (in-memory cache)
 *  - HTTP çağrısı       → ai-gateway.ts
 *  - Model adı          → ai-gateway.ts (GEMINI_MODEL env)
 *  - Timeout/retry      → ai-gateway.ts
 */

import { callAI, safeParseJSON } from './ai-gateway';
import { createClient } from '@supabase/supabase-js';

/** Tek Supabase server client (Singleton — her çağrıda yeniden oluşturulmaz) */
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ─── 1. Çeviri ────────────────────────────────────────────────────────────────

/**
 * Gayrimenkul açıklamasını hedef dile profesyonel emlakçı diliyle çevirir.
 */
export async function translateDescription(
  text: string,
  targetLang: 'en' | 'ar'
): Promise<string> {
  if (!text) return text;

  const langLabel = targetLang === 'en' ? 'İngilizceye' : 'Arapçaya';
  const prompt = `Aşağıdaki gayrimenkul ilan açıklamasını ${langLabel} profesyonel bir emlakçı diliyle çevir. Sadece çeviriyi döndür, başka açıklama yapma:\n\n${text}`;

  const result = await callAI(prompt);
  return result?.trim() || text;
}

// ─── 2. Lead Yeterlilik Analizi ──────────────────────────────────────────────

const LEAD_SCHEMA = {
  type: 'OBJECT' as const,
  properties: {
    score:        { type: 'number',  description: '0-100 arası müşteri potansiyel skoru' },
    intent_level: { type: 'string',  enum: ['Cold', 'Warm', 'Hot', 'VIP'] },
  },
  required: ['score', 'intent_level'],
};

/**
 * Müşteri formu ve davranış verilerini analiz ederek lead skoru üretir.
 */
export async function evaluateLead(
  leadData: any
): Promise<{ score: number; intent_level: string }> {
  const defaultResult = { score: 50, intent_level: 'Warm' };

  const behaviorInfo = leadData.behavior_data
    ? `
  - Ziyaret Ettiği İlan Sayısı: ${leadData.behavior_data.totalViews || 0}
  - İncelediği Bölgeler: ${JSON.stringify(leadData.behavior_data.preferredDistricts || {})}
  - İncelediği İlanların Ort. Bütçesi: ${leadData.behavior_data.averageBudget || 0} TL
  - İncelediği En Yüksek Fiyatlı İlan: ${leadData.behavior_data.highestPriceViewed || 0} TL
  `
    : 'Tarayıcıda ayak izi kaydı yok.';

  const prompt = `
Sen "Kaynak Gayrimenkul Quantum OS" sisteminin kıdemli müşteri istihbarat yapay zekasısın.
Aşağıdaki form verilerini ve kullanıcının sitedeki dijital ayak izi verilerini analiz et.

Müşteri için 0 ile 100 arasında bir "score" ve niyet seviyesini belirten "intent_level" (Cold/Warm/Hot/VIP) ata.

Skorlama Kriterleri:
- Formdaki bütçe ile incelediği ilanların fiyat aralığı uyuşuyorsa skor yüksektir.
- Sadece 1 ilana bakıp hemen form doldurduysa Warm, sitenin altını üstüne getirip form doldurduysa Hot/VIP.
- Lüks bölgedeki (Çankaya, Gölbaşı) mülklere ilgi gösterdiyse VIP potansiyelindedir.

Müşteri Form Verileri:
- İsim: ${leadData.name || 'Belirtilmedi'}
- Bölge Tercihi: ${leadData.district || 'Belirtilmedi'}
- Bütçe Tercihi: ${leadData.budget || 'Belirtilmedi'}
- İşlem Tipi: ${leadData.propertyType || 'Belirtilmedi'}
- Mesaj: ${leadData.message || 'Yok'}

Kullanıcının Sitedeki Dijital Ayak İzi:
${behaviorInfo}
`.trim();

  try {
    const aiText = await callAI(prompt, LEAD_SCHEMA);
    if (!aiText) return defaultResult;

    const result = safeParseJSON<typeof defaultResult>(aiText, defaultResult);
    return {
      score:        result.score        || defaultResult.score,
      intent_level: result.intent_level || defaultResult.intent_level,
    };
  } catch (error) {
    console.error('[AI] Lead analiz hatası:', error);
    return defaultResult;
  }
}

// ─── 3. AI Fiyat Analizi ─────────────────────────────────────────────────────

const PRICE_SCHEMA = {
  type: 'OBJECT' as const,
  properties: {
    evaluation:      { type: 'string', description: '2-3 cümle değerlendirme' },
    estimated_value: { type: 'string', description: 'X.XXX.XXX TL — Y.YYY.YYY TL formatında' },
    suggestion:      { type: 'string', description: 'Danışmana somut strateji önerisi' },
  },
  required: ['evaluation', 'estimated_value', 'suggestion'],
};

/**
 * Mülk için AI destekli fiyat analizi yapar.
 * Gerçek CMA ve bölge değerleme motoru verileriyle desteklenir.
 */
export async function analyzePriceWithAI(propertyData: any): Promise<{
  evaluation: string;
  estimated_value: string;
  suggestion: string;
  cma?: any;
  valuation?: any;
}> {
  const defaultResult = {
    evaluation:      'Piyasa verisi analiz edilemedi.',
    estimated_value: 'Hesaplanamıyor',
    suggestion:      'Manuel değerleme yapınız.',
  };

  const supabase = getServiceClient();

  // ADIM 1: Karşılaştırmalı Piyasa Analizi (CMA)
  let cmaData: any[] = [];
  let cmaStats = { count: 0, avgPrice: 0, minPrice: 0, maxPrice: 0, avgPricePerSqm: 0 };

  try {
    const sqm    = parseInt(propertyData.sqm) || 100;
    const sqmMin = Math.round(sqm * 0.75);
    const sqmMax = Math.round(sqm * 1.25);

    const { data: comparables } = await supabase
      .from('properties')
      .select('id, title, price, sqm, rooms, type, status')
      .eq('district_id', propertyData.district_id)
      .eq('type',        propertyData.type || 'Satılık')
      .eq('status',      'aktif')
      .neq('id',         propertyData.id)
      .gte('sqm',        sqmMin)
      .lte('sqm',        sqmMax)
      .limit(10);

    if (comparables && comparables.length > 0) {
      cmaData = comparables;
      const prices       = comparables.map((p: any) => Number(p.price));
      const pricesPerSqm = comparables
        .map((p: any) => (p.sqm > 0 ? Number(p.price) / Number(p.sqm) : 0))
        .filter((p: number) => p > 0);

      cmaStats = {
        count:         comparables.length,
        avgPrice:      Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
        minPrice:      Math.min(...prices),
        maxPrice:      Math.max(...prices),
        avgPricePerSqm: pricesPerSqm.length > 0
          ? Math.round(pricesPerSqm.reduce((a, b) => a + b, 0) / pricesPerSqm.length)
          : 0,
      };
    }
  } catch (e) {
    console.warn('[AI] CMA verisi çekilemedi:', e);
  }

  // ADIM 2: Ankara Bölge Değerleme Motoru
  let valuationReport: any = null;
  try {
    const { generateValuationReport } = await import('./valuation');
    valuationReport = generateValuationReport({
      title:        propertyData.title || '',
      price:        Number(propertyData.price) || 0,
      sqm:          Number(propertyData.sqm) || 0,
      rooms:        propertyData.rooms,
      type:         propertyData.type,
      district_id:  propertyData.district_id || '',
      neighborhood: propertyData.neighborhood,
      description:  propertyData.description || '',
    });
  } catch (e) {
    console.warn('[AI] Değerleme motoru hatası:', e);
  }

  // ADIM 3: AI yoksa saf hesaplama ile döndür
  const config = await (await import('./ai-gateway')).getAIConfig();
  if (!config) {
    if (valuationReport?.success) {
      const r = valuationReport;
      return {
        evaluation:      r.priceDeviation.evaluation,
        estimated_value: `${r.estimatedMinPrice.toLocaleString('tr-TR')} TL — ${r.estimatedMaxPrice.toLocaleString('tr-TR')} TL`,
        suggestion:      `${r.district} bölgesinde piyasa m² ortalaması ${r.marketAvgPerSqm.toLocaleString('tr-TR')} TL/m²'dir. Bu mülkün m² fiyatı ${r.actualPricePerSqm.toLocaleString('tr-TR')} TL/m² (${r.priceDeviation.label}).`,
        cma:             cmaStats,
        valuation:       valuationReport,
      };
    }
    return defaultResult;
  }

  // ADIM 4: AI zengin prompt — gerçek veriyle analiz
  const cmaSection = cmaStats.count > 0
    ? `
KARŞILAŞTIRMALI PİYASA ANALİZİ (CMA):
- Benzer İlan Sayısı (aynı ilçe, benzer m²): ${cmaStats.count} ilan
- Ortalama Satış Fiyatı: ${cmaStats.avgPrice.toLocaleString('tr-TR')} TL
- En Düşük Fiyat: ${cmaStats.minPrice.toLocaleString('tr-TR')} TL
- En Yüksek Fiyat: ${cmaStats.maxPrice.toLocaleString('tr-TR')} TL
- Ortalama m² Birim Fiyatı: ${cmaStats.avgPricePerSqm.toLocaleString('tr-TR')} TL/m²`
    : 'CMA: Bu ilçede sistemde karşılaştırılacak benzer ilan bulunamadı.';

  const valuationSection = valuationReport?.success
    ? `
ANKARA BÖLGE DEĞERLEME MOTORU:
- İlçe: ${valuationReport.district}
- Piyasa Ortalaması m² Fiyatı: ${valuationReport.marketAvgPerSqm.toLocaleString('tr-TR')} TL/m²
- Bu Mülkün m² Fiyatı: ${valuationReport.actualPricePerSqm.toLocaleString('tr-TR')} TL/m²
- Piyasa Sapması: ${valuationReport.priceDeviation.label} (%${valuationReport.priceDeviation.percentDiff > 0 ? '+' : ''}${valuationReport.priceDeviation.percentDiff})
- Tahmini Değer Aralığı: ${valuationReport.estimatedMinPrice.toLocaleString('tr-TR')} TL — ${valuationReport.estimatedMaxPrice.toLocaleString('tr-TR')} TL
- Yatırım Notu: ${valuationReport.investmentRating}
- Talep Skoru: ${valuationReport.demandScore}/100`
    : 'Bölge değerleme motoru: Bu ilçe için veri bulunamadı.';

  const prompt = `
Sen "Kaynak Gayrimenkul Quantum OS" sisteminin kıdemli değerleme uzmanısın (SPK Lisanslı).
CMA ve bölge endeksi verilerini yorumlayarak profesyonel bir değerleme raporu hazırla.

ÖNEMLİ: Spekülatif tahmin değil, veriye dayalı yorum yap.

GAYRİMENKUL BİLGİLERİ:
- Başlık: ${propertyData.title}
- Fiyat: ${Number(propertyData.price).toLocaleString('tr-TR')} TL
- İlçe: ${propertyData.district_id}
- Metrekare: ${propertyData.sqm} m²
- Oda Sayısı: ${propertyData.rooms || 'Belirtilmedi'}
- İşlem Tipi: ${propertyData.type || 'Satılık'}
- m² Birim Fiyatı: ${propertyData.sqm > 0 ? Math.round(propertyData.price / propertyData.sqm).toLocaleString('tr-TR') : 'Hesaplanamıyor'} TL/m²

${cmaSection}
${valuationSection}
`.trim();

  try {
    const aiText = await callAI(prompt, PRICE_SCHEMA);
    if (!aiText) throw new Error('Boş yanıt');

    const aiResult = safeParseJSON<typeof defaultResult>(aiText, defaultResult);
    return { ...aiResult, cma: cmaStats, valuation: valuationReport };
  } catch (error) {
    console.error('[AI] Fiyat Analizi hatası:', error);

    if (valuationReport?.success) {
      const r = valuationReport;
      return {
        evaluation:      r.priceDeviation.evaluation,
        estimated_value: `${r.estimatedMinPrice.toLocaleString('tr-TR')} TL — ${r.estimatedMaxPrice.toLocaleString('tr-TR')} TL`,
        suggestion:      `Bölge piyasa ortalaması ${r.marketAvgPerSqm.toLocaleString('tr-TR')} TL/m². Bu mülk ${r.priceDeviation.label.toLowerCase()} (${r.priceDeviation.percentDiff > 0 ? '+' : ''}${r.priceDeviation.percentDiff}%).`,
        cma:             cmaStats,
        valuation:       valuationReport,
      };
    }
    return defaultResult;
  }
}

// ─── 4. Yasal Uyum Denetimi ───────────────────────────────────────────────────

const COMPLIANCE_SCHEMA = {
  type: 'OBJECT' as const,
  properties: {
    is_compliant:   { type: 'boolean' },
    warning_reason: { type: 'string',  description: 'Uyumsuzluk gerekçesi veya null' },
  },
  required: ['is_compliant', 'warning_reason'],
};

/**
 * İlan başlığı ve açıklamasını Taşınmaz Ticareti Yönetmeliği'ne göre denetler.
 */
export async function checkLegalComplianceWithAI(
  title: string,
  description: string
): Promise<{ is_compliant: boolean; warning_reason: string | null }> {
  const defaultResult = { is_compliant: true, warning_reason: null };

  const prompt = `
Aşağıdaki gayrimenkul ilanı başlığını ve açıklamasını Türkiye Taşınmaz Ticareti Yönetmeliği'ne göre yasal uyum denetimine sok.
Özellikle şu kuralları ihlal edip etmediğini kontrol et:
1. Alıcıyı yanıltıcı, aldatıcı, gerçeğe aykırı ifadeler veya abartılı, kanıtlanamaz iddialar var mı?
2. "Emsalsiz", "bedava", "kelepir" gibi profesyonelliğe aykırı kelimeler aşırı/yanıltıcı şekilde kullanılmış mı?

İLAN BAŞLIĞI: "${title}"
İLAN AÇIKLAMASI: "${description}"
`.trim();

  try {
    const aiText = await callAI(prompt, COMPLIANCE_SCHEMA);
    if (!aiText) return defaultResult;

    return safeParseJSON<typeof defaultResult>(aiText, defaultResult);
  } catch (error) {
    console.error('[AI] Yasal Uyum denetim hatası:', error);
    return defaultResult;
  }
}
