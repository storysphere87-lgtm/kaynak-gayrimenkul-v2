import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api'], // Yönetim ve API gizli kalmalı
    },
    sitemap: 'https://kaynakgayrimenkul.com/sitemap.xml',
  };
}
