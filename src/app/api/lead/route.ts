import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabase } from '@/lib/supabase';
import { logApiCall } from '@/lib/api-logger';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const startTime = Date.now();
  let clientName = 'Belirtilmedi';

  try {
    const body = await request.json();
    const { name, phone, email, district, propertyType, budget, message, behavior_data } = body;
    clientName = name || 'Belirtilmedi';

    // Quantum OS AI Lead Skorlaması (Çerez davranış verisi dahil)
    const { evaluateLead } = await import('@/lib/ai');
    const { score, intent_level } = await evaluateLead({
      name, district, propertyType, budget, message, behavior_data
    });

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
        source: body.source || 'Direct',
        score: score,
        intent_level: intent_level,
        behavior_data: behavior_data || null,
        created_at: new Date().toISOString()
      }]);

    if (dbError) throw dbError;

    // 2. Resend ile E-Posta Bildirimi (Try/Catch Fallback Aktif)
    try {
      const emailStart = Date.now();
      const emailRes = await resend.emails.send({
        from: 'Kaynak Gayrimenkul <onboarding@resend.dev>',
        to: 'kaynakgayrimenkul06@gmail.com',
        subject: `📢 YENİ MÜŞTERİ TALEBİ: ${name}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #c8a96e; border-radius: 10px;">
            <h2 style="color: #c8a96e;">Yeni Lead Alındı (Skor: ${score}/100)</h2>
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
      
      logApiCall({
        endpoint: 'Resend SMTP Send',
        status: emailRes.error ? 'error' : 'success',
        statusCode: emailRes.error ? 500 : 200,
        errorMessage: emailRes.error?.message,
        durationMs: Date.now() - emailStart
      });
    } catch (e: any) {
      console.error('Email error:', e);
      logApiCall({
        endpoint: 'Resend SMTP Send (CRITICAL FALLBACK)',
        status: 'error',
        statusCode: 500,
        errorMessage: e.message,
        durationMs: 0
      });
    }

    // 3. Anlık Telegram Bildirimi (Try/Catch Fallback Aktif)
    try {
      const telegramStart = Date.now();
      const { sendTelegramNotification } = await import('@/lib/notifications');
      await sendTelegramNotification({
        name: name,
        phone: phone,
        email: email,
        district: district,
        message: message,
        score: score,
        intent_level: intent_level
      });

      logApiCall({
        endpoint: 'Telegram API Notify',
        status: 'success',
        statusCode: 200,
        durationMs: Date.now() - telegramStart
      });
    } catch (e: any) {
      console.error('Telegram error:', e);
      logApiCall({
        endpoint: 'Telegram API Notify (FALLBACK)',
        status: 'error',
        statusCode: 500,
        errorMessage: e.message,
        durationMs: 0
      });
    }

    // Başarılı API Loglama
    logApiCall({
      endpoint: 'POST /api/lead',
      status: 'success',
      statusCode: 200,
      durationMs: Date.now() - startTime
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Lead hatası:', error.message);
    
    // Hatalı API Loglama
    logApiCall({
      endpoint: `POST /api/lead (Client: ${clientName})`,
      status: 'error',
      statusCode: 500,
      errorMessage: error.message,
      durationMs: Date.now() - startTime
    });

    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
