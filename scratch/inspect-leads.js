const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectLeads() {
  try {
    const { data: leadData, error: leadError } = await supabase
      .from('leads')
      .insert({ phone: '123' })
      .select();

    if (leadError) {
      console.log("❌ Leads insert error:", leadError.message);
    } else {
      console.log("✅ Leads columns:", Object.keys(leadData[0]));
      await supabase.from('leads').delete().eq('id', leadData[0].id);
    }
  } catch (e) {
    console.error(e.message);
  }
}

inspectLeads();
