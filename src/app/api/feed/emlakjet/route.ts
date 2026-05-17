import { getAllProperties } from '@/lib/api';

export async function GET() {
  try {
    const properties = await getAllProperties();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://kaynakgayrimenkul.com';

    const listingsXml = properties.filter(p => p.status === 'aktif').map(p => {
      const islemSlug = p.type?.toLowerCase() === 'satılık' ? 'satilik' : 'kiralik';
      const propertyUrl = `${baseUrl}/tr/portfoy/${p.district_id}/${islemSlug}/${p.id}`;
      
      // Trovit format is widely accepted by EmlakJet and others
      const typeEn = p.type?.toLowerCase() === 'satılık' ? 'For Sale' : 'For Rent';

      const imagesXml = Array.isArray(p.images) && p.images.length > 0
        ? p.images.map((img: string) => `        <picture><picture_url><![CDATA[${img}]]></picture_url></picture>`).join('\n')
        : `        <picture><picture_url><![CDATA[${baseUrl}/hero-bg.png]]></picture_url></picture>`;

      return `
  <ad>
    <id><![CDATA[${p.id}]]></id>
    <url><![CDATA[${propertyUrl}]]></url>
    <title><![CDATA[${p.title}]]></title>
    <type><![CDATA[${typeEn}]]></type>
    <agency><![CDATA[Kaynak Gayrimenkul]]></agency>
    <content><![CDATA[${p.description || p.title}]]></content>
    <price><![CDATA[${p.price}]]></price>
    <property_type><![CDATA[${p.category || 'Konut'}]]></property_type>
    <floor_area><![CDATA[${p.sqm}]]></floor_area>
    <rooms><![CDATA[${p.rooms}]]></rooms>
    <city><![CDATA[Ankara]]></city>
    <city_area><![CDATA[${p.districts?.name || p.district_id}]]></city_area>
    <region><![CDATA[Ankara]]></region>
    <pictures>
${imagesXml}
    </pictures>
  </ad>`;
    }).join('');

    const xmlContent = `<?xml version="1.0" encoding="utf-8"?>
<trovit>
${listingsXml}
</trovit>`;

    return new Response(xmlContent, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate'
      }
    });
  } catch (error) {
    console.error('EmlakJet Feed Error:', error);
    return new Response('<?xml version="1.0" encoding="UTF-8"?><error>Internal Server Error</error>', {
      status: 500,
      headers: { 'Content-Type': 'application/xml' }
    });
  }
}
