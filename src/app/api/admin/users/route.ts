/**
 * KAYNAK GAYRİ MENKUL — Admin Kullanıcı Yönetim API
 * ====================================================
 * GET  /api/admin/users → Sistemdeki tüm kullanıcıları listeler
 * POST /api/admin/users → Belirtilen kullanıcının şifresini değiştirir
 *
 * Güvenlik: Supabase service_role ile korunur.
 * Bu endpoint SADECE Supabase'de doğrulanmış oturumu olan admin'ler tarafından çağrılmalı.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Service role client — yetki kısıtlaması yok
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/** Çağıran kullanıcının gerçekten 'admin' rolünde olduğunu veya geçerli sistem anahtarı kullandığını doğrular */
async function verifyAdminCaller(request?: NextRequest): Promise<boolean> {
  try {
    if (request) {
      const systemKey = request.headers.get('x-system-key');
      if (systemKey && systemKey === process.env.INGEST_API_KEY) {
        return true;
      }
    }

    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async get(name: string) {
            const store = await cookieStore;
            return store.get(name)?.value;
          },
          async set() {},
          async remove() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // JWT metadata'dan rol kontrol et
    let role = user.user_metadata?.role || '';

    // Yoksa profiles tablosuna bak
    if (!role || (role !== 'admin' && role !== 'agent')) {
      const { data: profile } = await adminClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      role = profile?.role || '';
    }

    return role === 'admin';
  } catch {
    return false;
  }
}

/**
 * GET /api/admin/users
 * Sistemdeki tüm Supabase Auth kullanıcılarını profiles tablosuyla birleştirerek döner.
 */
export async function GET(request: NextRequest) {
  // Admin kontrolü
  const isAdmin = await verifyAdminCaller(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Yetkisiz erişim. Sadece sistem yöneticileri bu endpoint\'e erişebilir.' }, { status: 403 });
  }

  try {
    // 1. Supabase Auth'taki tüm kullanıcıları listele (max 1000)
    const { data: { users }, error: authError } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (authError) throw authError;

    // 2. Profiles tablosundan ek bilgileri çek
    const { data: profiles } = await adminClient
      .from('profiles')
      .select('id, full_name, role, phone');

    const profileMap: Record<string, any> = {};
    if (profiles) {
      profiles.forEach(p => { profileMap[p.id] = p; });
    }

    // 3. Birleştir
    const enriched = (users || []).map(u => {
      const profile = profileMap[u.id];
      const role = profile?.role || u.user_metadata?.role || 'agent';
      return {
        id: u.id,
        email: u.email,
        full_name: profile?.full_name || u.user_metadata?.full_name || u.email?.split('@')[0] || 'İsimsiz',
        role,
        phone: profile?.phone || '',
        email_confirmed: !!u.email_confirmed_at,
        created_at: u.created_at,
        last_sign_in: u.last_sign_in_at,
      };
    });

    return NextResponse.json({ success: true, users: enriched });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/users
 * Body: { userId: string, newPassword: string }
 * Belirtilen kullanıcının şifresini service_role yetkisiyle değiştirir.
 * Admin olmayan çağıranlara 403 döner.
 */
export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdminCaller(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { userId, newPassword } = body;

    if (!userId || !newPassword) {
      return NextResponse.json({ error: 'userId ve newPassword alanları zorunludur.' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Şifre en az 6 karakter olmalıdır.' }, { status: 400 });
    }

    const { error } = await adminClient.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Şifre başarıyla güncellendi.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
