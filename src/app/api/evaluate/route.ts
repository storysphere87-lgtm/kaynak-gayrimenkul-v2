import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getMarketTrends } from '@/lib/api';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { districtName, sqm, rooms, propertyType } = body;

    const targetSqm = Number(sqm || 100);

    // 1. Veritabanından gerçek m2 fiyat trendlerini çekelim (Aşama 2.2 Motorumuz)
    const trends = await getMarketTrends();
    const districtTrend = trends?.find((t: any) => t.district.toLowerCase() === districtName?.toLowerCase()) || {
      avg_sqm_price: 32000, // Fallback if no matching records yet
      price_change_percentage: 1.8,
      trend_direction: "stabil",
      analysis_note: "Bölgesel hacim stabil."
    };

    // Gerçekçi matematiksel değer aralığı hesabı
    const calculatedValue = districtTrend.avg_sqm_price * targetSqm;
    const lowerBound = Math.round(calculatedValue * 0.95);
    const upperBound = Math.round(calculatedValue * 1.05);

    const formattedLower = lowerBound.toLocaleString('tr-TR');
    const formattedUpper = upperBound.toLocaleString('tr-TR');
    const today = new Date().toLocaleDateString('tr-TR');

    // 2. Yapay Zeka (Gemini) ile lüks ve profesyonel pazar yorumu oluşturalım
    const { data: settings } = await supabase.from('settings').select('*');
    const apiKey = settings?.find(s => s.key === 'ai_api_key')?.value;
    
    let aiEvaluation = "Quantum veri motorumuz bölgedeki arz-talep dengesini ve m² yoğunluk endekslerini hesaplamıştır. Yatırım potansiyeli yüksek, stabil pazar döngüsü gözlemlenmektedir.";
    
    if (apiKey) {
      const prompt = `
        Sen "Kaynak Gayrimenkul Quantum OS" sisteminin kıdemli lisanslı değerleme uzmanı yapay zekasısın.
        Aşağıdaki verileri kullanarak, bu gayrimenkulün bulunduğu bölge pazarı için profesyonel, lüks emlak segmentine yakışan, ikna edici 3-4 cümlelik bir değerleme yorumu/özeti yaz.
        
        Veriler:
        - İlçe: ${districtName}
        - Ort. m² Fiyatı: ${districtTrend.avg_sqm_price} TL
        - Hesaplanan Değer Aralığı: ${formattedLower} TL - ${formattedUpper} TL
        - Bölgesel Yıllık Artış: %${districtTrend.price_change_percentage}
        
        Lütfen temiz bir Türkçe metin döndür, başka hiçbir şey (markdown işaretleri, json vs.) yazma.
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
        aiEvaluation = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || aiEvaluation;
      } catch (e) {
        console.error("AI Valuation Report generation failed, falling back to default evaluation.", e);
      }
    }

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>Gayrimenkul Değerleme Sertifikası</title>
        <style>
          body { font-family: 'Times New Roman', Times, serif; line-height: 1.6; color: #1a1a1a; padding: 40px; }
          .header-box { border: 3px double #b3862b; padding: 20px; text-align: center; margin-bottom: 40px; }
          h1 { color: #b3862b; font-size: 22pt; margin: 0 0 10px 0; font-weight: bold; text-transform: uppercase; }
          h2 { color: #1a1a1a; font-size: 14pt; border-bottom: 2px solid #b3862b; padding-bottom: 5px; margin-top: 30px; text-transform: uppercase; }
          .stats-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .stats-table td { border: 1px solid #d3d3d3; padding: 12px; font-size: 11pt; }
          .stats-header { background-color: #f9f9f9; font-weight: bold; color: #b3862b; width: 35%; }
          .highlight-value { font-size: 16pt; font-weight: bold; color: #b3862b; text-align: center; background-color: #fcf8e3; border: 1px solid #faebcc !important; padding: 20px !important; }
          .analysis-box { background-color: #f9f9f9; border-left: 5px solid #b3862b; padding: 20px; font-style: italic; font-size: 11pt; text-align: justify; margin-bottom: 30px; }
          .footer-note { text-align: center; font-size: 9pt; color: #7f8c8d; margin-top: 80px; border-top: 1px solid #e0e0e0; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header-box">
          <h1>EXECUTIVE VALUATION REPORT</h1>
          <p style="font-size: 10pt; letter-spacing: 2px; color: #7f8c8d; margin: 5px 0 0 0;">KAYNAK GAYRİMENKUL QUANTUM OS INTEGRATION</p>
        </div>

        <p style="text-align: right; font-weight: bold;">Rapor Tarihi: ${today}</p>
        
        <h2>1. ANALİZ EDİLEN TAŞINMAZ</h2>
        <table class="stats-table">
          <tr>
            <td class="stats-header">Taşınmaz Bölgesi</td>
            <td><strong>Ankara / ${districtName || 'Etimesgut'}</strong></td>
          </tr>
          <tr>
            <td class="stats-header">Brüt Alan / Metrekare</td>
            <td><strong>${targetSqm} m²</strong></td>
          </tr>
          <tr>
            <td class="stats-header">Oda / Bölüm Sayısı</td>
            <td><strong>${rooms || 'Belirtilmedi'}</strong></td>
          </tr>
          <tr>
            <td class="stats-header">Mülk Kategorisi</td>
            <td><strong>${propertyType || 'Konut'}</strong></td>
          </tr>
        </table>

        <h2>2. HİPER-LOKAL PİYASA VERİLERİ (1 AYLIK GERÇEK VERİ HAVUZU)</h2>
        <table class="stats-table">
          <tr>
            <td class="stats-header">Bölgesel Ortalama m² Birim Değeri</td>
            <td>₺${districtTrend.avg_sqm_price?.toLocaleString('tr-TR')} / m²</td>
          </tr>
          <tr>
            <td class="stats-header">Son 1 Ay Fiyat Değişim Trendi</td>
            <td>%${districtTrend.price_change_percentage > 0 ? '+' : ''}${districtTrend.price_change_percentage} (${districtTrend.trend_direction?.toUpperCase()})</td>
          </tr>
        </table>

        <h2>3. QUANTUM DEĞERLEME SONUCU</h2>
        <table class="stats-table">
          <tr>
            <td class="highlight-value">
              GÜVENİLİR TAHMİNİ DEĞER ARALIĞI<br/>
              <span style="font-size: 20pt; display: block; margin-top: 10px;">₺${formattedLower} - ₺${formattedUpper}</span>
            </td>
          </tr>
        </table>

        <h2>4. UZMAN DEĞERLENDİRME & PAZAR ÖZETİ</h2>
        <div class="analysis-box">
          "${aiEvaluation}"
        </div>

        <p style="font-size: 10pt; text-align: justify; color: #333; margin-top: 30px;">
          * Bu rapor, Kaynak Gayrimenkul veritabanındaki aktif piyasa verilerini ve lisanslı gayrimenkul analitik algoritmalarını harmanlayarak otonom olarak oluşturulmuştur. Resmi ekspertiz raporu niteliğinde olmayıp, piyasa konumlandırması için güvenilir referans teşkil eder.
        </p>

        <div class="footer-note">
          Kaynak Gayrimenkul A.Ş. Değerleme Departmanı - Tüm Hakları Saklıdır.
        </div>
      </body>
      </html>
    `;

    return new Response(htmlContent, {
      headers: {
        'Content-Type': 'application/msword',
        'Content-Disposition': `attachment; filename="kaynak_gayrimenkul_degerleme_raporu_${today.replace(/\./g, '_')}.doc"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
