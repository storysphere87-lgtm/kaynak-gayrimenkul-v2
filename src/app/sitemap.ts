import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Bypass RLS to index all active properties
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://kaynakgayrimenkul.com';
  const languages = ['tr', 'en', 'ar'];

  // 1. Statik Rotalar (Tüm Diller İçin)
  const staticPaths = [
    '',
    '/portfoy',
    '/araclar/roportaj',
    '/hakkimizda',
    '/iletisim'
  ];

  const staticUrls: MetadataRoute.Sitemap = [];
  
  languages.forEach((lang) => {
    staticPaths.forEach((path) => {
      staticUrls.push({
        url: `${baseUrl}/${lang}${path}`,
        lastModified: new Date(),
        changeFrequency: path === '' ? 'daily' : 'weekly',
        priority: path === '' ? 1.0 : 0.8,
      });
    });
  });

  // 2. Dinamik İlan Rotaları (Veritabanından Canlı Çekim)
  const dynamicUrls: MetadataRoute.Sitemap = [];
  try {
    const { data: properties } = await supabase
      .from('properties')
      .select('id, updated_at, district_id, type')
      .eq('status', 'aktif');

    if (properties) {
      properties.forEach((prop) => {
        const ilce = prop.district_id || 'cankaya';
        const islem = (prop.type && prop.type.toLowerCase().startsWith('s')) ? 'satilik' : 'kiralik';
        languages.forEach((lang) => {
          dynamicUrls.push({
            url: `${baseUrl}/${lang}/portfoy/${ilce}/${islem}/${prop.id}`,
            lastModified: prop.updated_at ? new Date(prop.updated_at) : new Date(),
            changeFrequency: 'weekly',
            priority: 0.6,
          });
        });
      });
    }
  } catch (error) {
    console.error('Error generating dynamic sitemap routes:', error);
  }

  return [...staticUrls, ...dynamicUrls];
}

