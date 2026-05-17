import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    
    // Güvenlik için ortam değişkeninden şifreyi alıyoruz.
    // Eğer env tanımlı değilse, fallback olarak güçlü bir şifre (sadece demo/geliştirme amaçlı).
    const adminPassword = process.env.ADMIN_PASSWORD || 'Kaynak2026!';

    if (password === adminPassword) {
      const response = NextResponse.json({ success: true });
      response.cookies.set({
        name: 'admin_session',
        value: 'authenticated',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 hafta
      });
      return response;
    }

    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
  }
}
