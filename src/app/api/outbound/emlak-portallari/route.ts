import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // 1. Veritabanından tüm aktif ilanları çekelim
    const { data: properties, error } = await supabase
      .from('properties')
      .select('*, districts(name)')
      .eq('status', 'aktif');

    if (error) throw error;

    // 2. Zingat & HepsiEmlak standartlarında XML feed oluşturulması
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<properties>\n`;

    properties?.forEach((prop: any) => {
      xml += `  <property id="${prop.id}">\n`;
      xml += `    <title><![CDATA[${prop.title}]]></title>\n`;
      xml += `    <description><![CDATA[${prop.description}]]></description>\n`;
      xml += `    <price currency="TRY">${prop.price}</price>\n`;
      xml += `    <type>${prop.type === 'Satılık' ? 'sale' : 'rent'}</type>\n`;
      xml += `    <category>${prop.category || 'Daire'}</category>\n`;
      xml += `    <sqm>${prop.sqm}</sqm>\n`;
      xml += `    <rooms>${prop.rooms}</rooms>\n`;
      xml += `    <location>\n`;
      xml += `      <city>Ankara</city>\n`;
      xml += `      <district><![CDATA[${prop.districts?.name || 'Etimesgut'}]]></district>\n`;
      xml += `    </location>\n`;
      
      if (prop.images && prop.images.length > 0) {
        xml += `    <images>\n`;
        prop.images.forEach((imgUrl: string) => {
          xml += `      <image><![CDATA[${imgUrl}]]></image>\n`;
        });
        xml += `    </images>\n`;
      }
      
      xml += `    <agency>\n`;
      xml += `      <name>Kaynak Gayrimenkul</name>\n`;
      xml += `      <email>kaynakgayrimenkul06@gmail.com</email>\n`;
      xml += `      <phone>+905451932006</phone>\n`;
      xml += `    </agency>\n`;
      xml += `    <updated_at>${prop.updated_at || new Date().toISOString()}</updated_at>\n`;
      xml += `  </property>\n`;
    });

    xml += `</properties>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
