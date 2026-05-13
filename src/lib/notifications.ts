/**
 * Nextoria Bildirim Sistemi - Telegram Versiyonu
 */
export async function sendTelegramNotification(data: {
  name: string;
  phone: string;
  email?: string;
  message?: string;
  district?: string;
}) {
  // SaaS Ayarlarını Veritabanından Çekiyoruz
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: settings } = await supabase.from('settings').select('*');
  
  const BOT_TOKEN = settings?.find(s => s.key === 'telegram_bot_token')?.value || process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = settings?.find(s => s.key === 'telegram_chat_id')?.value || process.env.TELEGRAM_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn("Telegram ayarları bulunamadı (DB veya ENV).");
    return;
  }

  const text = `
📢 *YENİ MÜŞTERİ TALEBİ*

👤 *İsim:* ${data.name}
📞 *Telefon:* ${data.phone}
📧 *E-posta:* ${data.email || 'Yok'}
📍 *Bölge:* ${data.district || 'Belirtilmedi'}
💬 *Mesaj:* ${data.message || 'Yok'}

_Bu bildirim Kaynak Gayrimenkul sisteminden otomatik gönderilmiştir._
  `;

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: text,
        parse_mode: 'Markdown'
      })
    });
  } catch (error) {
    console.error("Telegram bildirim hatası:", error);
  }
}
