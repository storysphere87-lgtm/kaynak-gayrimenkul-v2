import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logApiCall } from '@/lib/api-logger';

/**
 * Quantum OS - Otonom SEO Teknik Denetim Motoru (Faz 3)
 * Screaming Frog CLI / Ahrefs işlevselliğini sıfır maliyetle tarayıcı üzerinde simüle eder.
 * Sitedeki kritik rotaları (Home, Portfoy, Iletisim, Evimi Satmak İstiyorum) tarar,
 * kırık link (broken link), eksik meta description veya canonical etiket hatalarını raporlar.
 */
export async function GET() {
  const startTime = Date.now();
  
  const targetUrls = [
    'https://kaynakgayrimenkul.com/tr',
    'https://kaynakgayrimenkul.com/en',
    'https://kaynakgayrimenkul.com/ar',
    'https://kaynakgayrimenkul.com/tr/evimi-satmak-istiyorum',
    'https://kaynakgayrimenkul.com/tr/iletisim'
  ];

  const auditResults: any[] = [];

  for (const url of targetUrls) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; QuantumSEO-Audit/1.0)' }
      });

      if (res.status !== 200) {
        auditResults.push({
          url,
          status: 'error',
          statusCode: res.status,
          issue: `Sayfa erişilemez durumda (HTTP ${res.status})`
        });
        continue;
      }

      const html = await res.text();

      // Meta Tag Denetimleri
      const issues: string[] = [];
      
      if (!html.includes('<title>')) {
        issues.push('Missing <title> tag');
      }
      if (!html.includes('description') && !html.includes('meta name="description"')) {
        issues.push('Missing <meta name="description"> tag');
      }
      if (!html.includes('rel="canonical"')) {
        issues.push('Missing <link rel="canonical"> tag');
      }
      if (!html.includes('yandex-verification')) {
        issues.push('Missing Yandex Webmaster Verification tag');
      }

      auditResults.push({
        url,
        status: issues.length === 0 ? 'perfect' : 'warning',
        statusCode: 200,
        issues: issues.length > 0 ? issues : null
      });

    } catch (err: any) {
      auditResults.push({
        url,
        status: 'critical',
        issue: `Sunucu hatası veya bağlantı koptu: ${err.message}`
      });
    }
  }

  // Denetim sonuçlarını veritabanına logla
  const durationMs = Date.now() - startTime;
  
  logApiCall({
    endpoint: 'GET /api/seo-audit',
    status: 'success',
    statusCode: 200,
    durationMs
  });

  // Hatalı veya uyarılı durumlar varsa broker'a Telegram ile özet rapor geç
  const errors = auditResults.filter(r => r.status === 'error' || r.status === 'critical' || r.status === 'warning');
  if (errors.length > 0) {
    try {
      const { sendTelegramNotification } = await import('@/lib/notifications');
      
      const issueDetails = errors.map(e => {
        const details = e.issues ? e.issues.join(', ') : e.issue;
        return `🔗 *URL:* ${e.url}\n⚠️ *Bulgu:* ${details}`;
      }).join('\n\n');

      await sendTelegramNotification({
        name: "SEO ENGINE AUDITOR",
        phone: "0000000000",
        message: `📢 *AYLIK OTONOM TEKNİK SEO AUDİT RAPORU*\nSistem taramasında bazı eksiklikler tespit edildi:\n\n${issueDetails}`
      });
    } catch (telegramErr) {
      console.error("SEO Audit Telegram error:", telegramErr);
    }
  }

  return NextResponse.json({
    success: true,
    total_pages_scanned: targetUrls.length,
    issues_found: errors.length,
    results: auditResults,
    duration_ms: durationMs
  }, { status: 200 });
}
