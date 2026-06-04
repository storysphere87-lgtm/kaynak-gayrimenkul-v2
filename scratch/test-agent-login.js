const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function diagnose() {
  console.log("=== Testing Agent Login ===");
  console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const start = Date.now();
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'danisman@kaynakgayrimenkul.com',
      password: 'kaynakgayrimenkul123'
    });
    
    console.log(`Response time: ${Date.now() - start}ms`);
    if (error) {
      console.log("❌ Login failed:", error.message, `(Status: ${error.status})`);
    } else {
      console.log("✅ Login successful! Session details:");
      console.log("User ID:", data.user.id);
      console.log("Email:", data.user.email);
      console.log("Metadata:", data.user.user_metadata);
    }
  } catch (e) {
    console.log(`❌ Critical error during request (Time: ${Date.now() - start}ms):`, e.message);
  }
}

diagnose();
