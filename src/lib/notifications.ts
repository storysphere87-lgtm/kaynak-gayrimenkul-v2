/**
 * Nextoria Bildirim Sistemi - Telegram Versiyonu
 */
export async function sendTelegramNotification(data: {
  name: string;
  phone: string;
  email?: string;
  message?: string;
  district?: string;
  score?: number;
  intent_level?: string;
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

  const isVip = data.score !== undefined && data.score >= 75;
  const alarmTitle = isVip 
    ? `🚨 *KRİTİK VIP AI LEAD ALARMI* (Skor: ${data.score}/100) 🚨`
    : `📢 *YENİ MÜŞTERİ TALEBİ* (Skor: ${data.score || 50}/100)`;

  const text = `${alarmTitle}

👤 *İsim:* ${data.name}
📞 *Telefon:* ${data.phone}
📧 *E-posta:* ${data.email || 'Yok'}
📍 *Bölge:* ${data.district || 'Belirtilmedi'}
🔥 *Niyet Derecesi:* ${data.intent_level || 'Warm'}
💬 *Mesaj:* ${data.message || 'Yok'}

_Bu bildirim Kaynak Gayrimenkul Quantum OS tarafından otonom gönderilmiştir._`;

  // Müşteriye anında tek tıkla AI WhatsApp şablonuyla yazma butonu
  const rawPhone = data.phone.replace(/[^0-9]/g, '');
  // Eğer ülke kodu yoksa Türkiye varsayalım
  const finalPhone = rawPhone.length === 10 ? `90${rawPhone}` : rawPhone;
  const waGreeting = `Merhaba ${data.name} Bey, Kaynak Gayrimenkul'den arıyorum. Web sitemiz üzerinden ilettiğiniz ${data.district || 'lüks konut'} bölgesi hakkındaki talebinizi aldım. Size en uygun yatırım portföylerimizi sunmak adına ne zaman görüşebiliriz?`;
  const waLink = `https://wa.me/${finalPhone}?text=${encodeURIComponent(waGreeting)}`;

  const inlineKeyboard = {
    inline_keyboard: [
      [
        {
          text: "💬 Müşteriye WhatsApp'tan Yaz (AI Şablonu)",
          url: waLink
        }
      ]
    ]
  };

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: text,
        parse_mode: 'Markdown',
        reply_markup: inlineKeyboard
      })
    });
  } catch (error) {
    console.error("Telegram bildirim hatası:", error);
  }
}

