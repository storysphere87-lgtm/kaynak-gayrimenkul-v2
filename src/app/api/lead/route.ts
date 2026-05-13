import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabase } from '@/lib/supabase';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, email, district, propertyType, budget, message } = body;

    // 1. Supabase'e Kayıt (CRM)
    const { error: dbError } = await supabase
      .from('leads')
      .insert([{ 
        full_name: name, 
        phone, 
        email, 
        district, 
        property_type: propertyType, 
        budget, 
        message,
        created_at: new Date().toISOString()
      }]);

    if (dbError) throw dbError;

    // 2. Resend ile E-Posta Bildirimi
    try {
      await resend.emails.send({
        from: 'Kaynak Gayrimenkul <onboarding@resend.dev>',
        to: 'fixankara1@gmail.com',
        subject: `📢 YENİ MÜŞTERİ TALEBİ: ${name}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #c8a96e; border-radius: 10px;">
            <h2 style="color: #c8a96e;">Yeni Lead Alındı</h2>
            <p><strong>Müşteri:</strong> ${name}</p>
            <p><strong>Telefon:</strong> ${phone}</p>
            <p><strong>E-posta:</strong> ${email || 'Belirtilmedi'}</p>
            <p><strong>Bölge:</strong> ${district}</p>
            <p><strong>İşlem Tipi:</strong> ${propertyType}</p>
            <hr style="border: 0.5px solid #eee; margin: 20px 0;" />
            <p><em>Bu talep web sitenizdeki form üzerinden otomatik olarak oluşturulmuştur.</em></p>
          </div>
        `
      });
    } catch (e) { console.error('Email error:', e); }

    // 3. Anlık Telegram Bildirimi (Güvenli, Ücretsiz ve Kesintisiz)
    try {
      const { sendTelegramNotification } = await import('@/lib/notifications');
      await sendTelegramNotification({
        name: name,
        phone: phone,
        email: email,
        district: district,
        message: message
      });
    } catch (e) { console.error('Telegram error:', e); }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Lead hatası:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
