const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function updateKey() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Supabase yapılandırması eksik.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const newKey = 'AIzaSyDS7ct5hF6jsxv4a37Lz4ZoguwJw4oFvbI';

  console.log("🛠️ Supabase settings tablosu güncelleniyor...");

  try {
    // ai_api_key'i güncelle
    const { data: dataKey, error: errorKey } = await supabase
      .from('settings')
      .update({ value: newKey })
      .eq('key', 'ai_api_key');

    if (errorKey) {
      throw errorKey;
    }
    console.log("✅ ai_api_key başarıyla güncellendi.");

    // ai_provider'ı gemini yap
    const { data: dataProv, error: errorProv } = await supabase
      .from('settings')
      .update({ value: 'gemini' })
      .eq('key', 'ai_provider');

    if (errorProv) {
      throw errorProv;
    }
    console.log("✅ ai_provider başarıyla 'gemini' olarak ayarlandı.");

  } catch (e) {
    console.error("❌ Güncelleme sırasında hata oluştu:", e.message);
  }
}

updateKey();
