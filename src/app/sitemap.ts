import { MetadataRoute } from 'next';
import { getAllProperties, getAllDistricts } from '@/lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://kaynakgayrimenkul.com';
  const languages = ['tr', 'en', 'ar'];
  
  // Statik Sayfalar
  const routes = ['', '/portfoy', '/hakkimizda', '/iletisim', '/evimi-satmak-istiyorum'];
  
  const staticEntries = languages.flatMap((lang) => 
    routes.map((route) => ({
      url: `${baseUrl}/${lang}${route}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: route === '' ? 1 : 0.8,
    }))
  );

  // Dinamik İlanlar
  const properties = await getAllProperties();
  const districts = await getAllDistricts();

  const propertyEntries = properties.flatMap((prop: any) => 
    languages.map((lang) => ({
      url: `${baseUrl}/${lang}/portfoy/${prop.district_id}/${prop.type.toLowerCase() === 'satılık' ? 'satilik' : 'kiralik'}/${prop.id}`,
      lastModified: new Date(prop.updated_at || prop.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))
  );

  // Dinamik İlçe Sayfaları
  const districtEntries = districts.flatMap((dist: any) => 
    languages.flatMap((lang) => [
      {
        url: `${baseUrl}/${lang}/portfoy/${dist.slug}/satilik`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      },
      {
        url: `${baseUrl}/${lang}/portfoy/${dist.slug}/kiralik`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }
    ])
  );

  return [...staticEntries, ...propertyEntries, ...districtEntries];
}
