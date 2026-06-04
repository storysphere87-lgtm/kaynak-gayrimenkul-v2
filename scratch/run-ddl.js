const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function tryRPCs() {
  const sql = "ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL;";
  const rpcs = ['exec_sql', 'run_sql', 'execute_sql', 'sql', 'query'];

  for (const rpc of rpcs) {
    try {
      console.log(`Trying RPC: ${rpc}...`);
      const { data, error } = await supabase.rpc(rpc, { sql_query: sql, query: sql, query_text: sql, sql: sql });
      if (error) {
        console.log(`❌ RPC ${rpc} failed with error:`, error.message);
      } else {
        console.log(`✅ RPC ${rpc} SUCCEEDED! DDL Executed.`);
        process.exit(0);
      }
    } catch (e) {
      console.log(`❌ RPC ${rpc} threw exception:`, e.message);
    }
  }
}

tryRPCs();
