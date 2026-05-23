'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

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
        async set(name: string, value: string, options: any) {
          try {
            const store = await cookieStore;
            store.set({ name, value, ...options });
          } catch (error) {
            // Context handled by middleware
          }
        },
        async remove(name: string, options: any) {
          try {
            const store = await cookieStore;
            store.set({ name, value: '', ...options });
          } catch (error) {
            // Context handled by middleware
          }
        },
      },
    }
  );

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: 'Geçersiz e-posta veya şifre.' };
  }

  // Redirect to pipeline after successful login
  redirect('/tr/admin/pipeline');
}
