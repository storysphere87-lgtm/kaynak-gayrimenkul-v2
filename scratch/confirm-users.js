const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function confirmUsers() {
  console.log("=== Supabase E-posta Doğrulama Operasyonu Başladı ===");
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY.trim()
  );

  const users = [
    { id: '914a4cbe-e499-438f-b429-009f7f51bbd1', email: 'broker@kaynakgayrimenkul.com' },
    { id: '422cc5f8-e583-49f9-8934-cf3418d04564', email: 'danisman@kaynakgayrimenkul.com' }
  ];

  for (const user of users) {
    console.log(`E-posta doğrulanıyor: ${user.email}...`);
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      email_confirm: true
    });
    
    if (error) {
      console.error(`❌ Hata (${user.email}):`, error.message);
    } else {
      console.log(`✅ Başarılı (${user.email}) -> E-posta doğrulandı.`);
    }
  }
}

confirmUsers();
