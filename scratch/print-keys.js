const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function compareKeys() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const envKey = process.env.GEMINI_API_KEY;
  console.log("envKey length:", envKey ? envKey.length : 0);
  console.log("envKey snippet:", envKey ? `${envKey.substring(0, 15)}...${envKey.slice(-5)}` : "empty");

  const { data: settings } = await supabase.from('settings').select('*');
  const dbKey = settings?.find(s => s.key === 'ai_api_key')?.value;
  console.log("dbKey length:", dbKey ? dbKey.length : 0);
  console.log("dbKey snippet:", dbKey ? `${dbKey.substring(0, 15)}...${dbKey.slice(-5)}` : "empty");
}

compareKeys();
