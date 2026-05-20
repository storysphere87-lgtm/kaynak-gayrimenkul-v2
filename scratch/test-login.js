const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function diagnose() {
  console.log("=== Supabase Bağlantı Teşhis Başlatıldı ===");
  console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  console.log("Giriş denemesi yapılıyor (master_patron@sahaos.com)...");
  
  const start = Date.now();
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'master_patron@sahaos.com',
      password: 'randompassword123'
    });
    
    console.log(`Cevap süresi: ${Date.now() - start}ms`);
    if (error) {
      console.log("❌ Supabase Giriş Başarısız (Hata):", error.message, `(Durum: ${error.status})`);
    } else {
      console.log("✅ Giriş Başarılı:", data);
    }
  } catch (e) {
    console.log(`❌ İstek Sırasında Kritik Hata (Süre: ${Date.now() - start}ms):`, e.message);
  }
}

diagnose();
