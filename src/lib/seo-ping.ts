import { supabase } from './supabase';

/**
 * Quantum OS - Arama Motoru İndeksleme ve Sitemap Pinger (Faz 3)
 * İlan eklendiğinde veya güncellendiğinde Google botlarını otonom olarak uyararak
 * yeni premium portföyün dakikalar içinde indexlenmesini sağlar.
 */
export async function pingGoogleSitemap() {
  const sitemapUrl = 'https://kaynakgayrimenkul.com/sitemap.xml';
  const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
  
  try {
    const start = Date.now();
    const res = await fetch(pingUrl, { method: 'GET' });
    
    // Sitemap ping günlüğünü veritabanına kaydet
    await supabase.from('sitemap_pings').insert([{
      target_url: sitemapUrl,
      status_code: res.status,
      response_body: `Sitemap successfully pinged. Google responded with: ${res.statusText || 'OK'}`,
      created_at: new Date().toISOString()
    }]);

    console.log("Google Sitemap Ping başarılı:", sitemapUrl);
  } catch (err: any) {
    console.error("Google Sitemap Ping hatası:", err.message);
    
    // Hatalı ping günlüğünü kaydet
    try {
      await supabase.from('sitemap_pings').insert([{
        target_url: sitemapUrl,
        status_code: 500,
        response_body: `Ping failed. Exception: ${err.message}`,
        created_at: new Date().toISOString()
      }]);
    } catch (dbErr) {
      console.error("Sitemap ping DB log hatası:", dbErr);
    }
  }
}
