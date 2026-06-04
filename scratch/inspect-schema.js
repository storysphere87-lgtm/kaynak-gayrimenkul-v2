const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspect() {
  try {
    // 1. Districts tablosundan bir kayıt çekmeyi dene
    const { data: districts, error: dError } = await supabase
      .from('districts')
      .select('*')
      .limit(1);

    if (dError) {
      console.log("❌ Districts select hatası:", dError.message);
    } else {
      console.log("✅ Districts mevcut kayıtlar:", districts);
      if (districts && districts.length > 0) {
        console.log("Districts columns in DB:", Object.keys(districts[0]));
      }
    }

    // 2. Districts tablosuna boş/minimum bir nesne ekleyip dönen kolonları gör
    const { data: insData, error: insError } = await supabase
      .from('districts')
      .insert({ name: 'Schema Test District ' + Date.now() })
      .select();
    
    if (insError) {
      console.log("❌ Districts insert deneme hatası:", insError.message);
    } else {
      console.log("✅ Districts insert başarılı. Dönen kolonlar:", Object.keys(insData[0]));
      // Temizle
      await supabase.from('districts').delete().eq('id', insData[0].id);
    }

    // 3. Properties tablosunu incele
    const { data: propData, error: propError } = await supabase
      .from('properties')
      .insert({ title: 'Schema Test Property ' + Date.now() })
      .select();

    if (propError) {
      console.log("❌ Properties insert deneme hatası:", propError.message);
    } else {
      console.log("✅ Properties insert başarılı. Dönen kolonlar:", Object.keys(propData[0]));
      // Temizle
      await supabase.from('properties').delete().eq('id', propData[0].id);
    }

  } catch (e) {
    console.error("Hata:", e.message);
  }
}

inspect();
