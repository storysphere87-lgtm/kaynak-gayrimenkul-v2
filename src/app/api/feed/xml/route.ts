import { getAllProperties } from '@/lib/api';

export async function GET() {
  try {
    const properties = await getAllProperties();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://kaynakgayrimenkul.com';

    const listingsXml = properties.map(p => {
      const islemSlug = p.type?.toLowerCase() === 'satılık' ? 'satilik' : 'kiralik';
      const propertyUrl = `${baseUrl}/tr/portfoy/${p.district_id}/${islemSlug}/${p.id}`;
      
      // Handle images array properly
      const imagesXml = Array.isArray(p.images) && p.images.length > 0
        ? p.images.map((img: string) => `        <image>${img}</image>`).join('\n')
        : `        <image>${baseUrl}/hero-bg.png</image>`;

      return `
    <listing>
      <id>${p.id}</id>
      <title><![CDATA[${p.title}]]></title>
      <price currency="TRY">${p.price}</price>
      <type>${p.type}</type>
      <category><![CDATA[${p.category || 'Konut'}]]></category>
      <sqm>${p.sqm}</sqm>
      <rooms>${p.rooms}</rooms>
      <district><![CDATA[${p.districts?.name || p.district_id}]]></district>
      <description><![CDATA[${p.description || `${p.title} - ${p.rooms} - ${p.sqm} m2. Detaylı bilgi için Kaynak Gayrimenkul ile iletişime geçin.`}]]></description>
      <url>${propertyUrl}</url>
      <images>
${imagesXml}
      </images>
      <last_update>${p.created_at || new Date().toISOString()}</last_update>
    </listing>`;
    }).join('');

    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<realty_feed>
  <company_name>Kaynak Gayrimenkul</company_name>
  <last_update>${new Date().toISOString()}</last_update>
  <listings>${listingsXml}
  </listings>
</realty_feed>`;

    return new Response(xmlContent, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate'
      }
    });
  } catch (error) {
    console.error('XML Feed Generation Error:', error);
    return new Response('<?xml version="1.0" encoding="UTF-8"?><error>Internal Server Error</error>', {
      status: 500,
      headers: { 'Content-Type': 'application/xml' }
    });
  }
}
