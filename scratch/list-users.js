const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function listUsers() {
  console.log("=== Supabase Veritabanı Kayıtlı Kullanıcı Analizi ===");
  
  // Service role yetkili client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY.trim()
  );

  try {
    // 1. Auth tablosundaki tüm üyeleri çek
    console.log("Auth tablosu sorgulanıyor...");
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) throw authError;

    console.log(`\n👥 Kayıtlı Toplam Auth Üye Sayısı: ${users.length}`);
    users.forEach((u, i) => {
      console.log(`[${i+1}] Email: ${u.email} | ID: ${u.id} | Metadata Role: ${u.user_metadata?.role} | Name: ${u.user_metadata?.full_name}`);
    });

    // 2. Profiles tablosundaki tüm verileri çek
    console.log("\nprofiles tablosu sorgulanıyor...");
    const { data: profiles, error: profError } = await supabase.from('profiles').select('*');
    
    if (profError) throw profError;

    console.log(`\n💼 Kayıtlı Toplam Profil Sayısı: ${profiles.length}`);
    profiles.forEach((p, i) => {
      console.log(`[${i+1}] Name: ${p.full_name} | Role: ${p.role} | Phone: ${p.phone} | ID: ${p.id}`);
    });

  } catch (e) {
    console.error("❌ Kritik Hata:", e.message);
  }
}

listUsers();
