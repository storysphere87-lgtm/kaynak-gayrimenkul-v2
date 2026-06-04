const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDb() {
  try {
    const { data: properties, error } = await supabase.from('properties').select('*');
    if (error) {
      console.error("Error fetching properties:", error.message);
    } else {
      console.log(`Total properties in DB: ${properties.length}`);
      if (properties.length > 0) {
        console.log("Sample property:", properties[0]);
        console.log("Status of all properties:", properties.map(p => ({ id: p.id, status: p.status, title: p.title })));
      }
    }

    const { data: settings, error: sError } = await supabase.from('settings').select('*');
    if (sError) {
      console.error("Error fetching settings:", sError.message);
    } else {
      console.log("Settings keys & values:", settings.map(s => ({ key: s.key, value: s.value })));
    }
  } catch (e) {
    console.error("Connection error:", e.message);
  }
}

checkDb();
