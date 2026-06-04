import { NextResponse } from 'next/server';

/**
 * Quantum OS - Otonom VCard (.vcf) Jeneratörü (Faz 4)
 * NFC / Dijital Kartvizit üzerinden tıklandığında danışman rehber bilgilerini
 * kullanıcının telefonuna sıfır maliyetle, anında kaydeder.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name') || 'Cafer Peksoy';
    const phone = searchParams.get('phone') || '+905451932006';
    const email = searchParams.get('email') || 'info@kaynakgayrimenkul.com';
    const role = searchParams.get('role') || 'Kurucu & Lüks Konut Brokerı';

    // VCard Standardı (UTF-8 Karakter Desteğiyle)
    const vcardLines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN;CHARSET=UTF-8:${name}`,
      `TEL;TYPE=CELL,VOICE:${phone.replace(/\s+/g, '')}`,
      `EMAIL;TYPE=PREF,INTERNET:${email}`,
      'ORG;CHARSET=UTF-8:Kaynak Gayrimenkul',
      `TITLE;CHARSET=UTF-8:${role}`,
      'URL:https://kaynakgayrimenkul.com',
      'REV:' + new Date().toISOString(),
      'END:VCARD'
    ];

    const vcardContent = vcardLines.join('\r\n');

    return new Response(vcardContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/vcard; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(name)}.vcf"`
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
