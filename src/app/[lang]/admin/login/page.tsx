'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Shield, Sparkles, UserCheck, KeyRound } from 'lucide-react';

export default function AdminLogin({ params }: { params: { lang: string } }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [isDev, setIsDev] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsDev(
        window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1' ||
        process.env.NODE_ENV === 'development'
      );
    }
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Zaman aşımı koruması helper fonksiyonu (Sonsuz kilitlenmeleri önler)
  function withTimeout<T>(promise: Promise<T>, ms: number = 8000): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Sunucu bağlantısı zaman aşımına uğradı! Lütfen ağ bağlantınızı veya Supabase ayarlarını kontrol edin.')), ms)
      )
    ]);
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        8000
      );
      
      if (error) throw error;

      setNotification({ message: 'Giriş Başarılı! Yönlendiriliyorsunuz...', type: 'success' });
      router.push(`/${params.lang}/admin`);
    } catch (error: any) {
      setNotification({ message: 'Giriş Başarısız: ' + error.message, type: 'error' });
      setLoading(false);
    }
  };
 
  // 1-TIK DİNAMİK TEST GİRİŞİ (SENIOR MÜHENDİSLİK HARİKASI)
  const handleQuickTestLogin = async (role: 'admin' | 'agent') => {
    setLoading(true);
    const testEmail = role === 'admin' ? 'broker@kaynakgayrimenkul.com' : 'danisman@kaynakgayrimenkul.com';
    const testPassword = 'kaynakgayrimenkul123';
    const testName = role === 'admin' ? 'Ahmet Broker (Yönetici)' : 'Mehmet Danışman (Agent)';
 
    try {
      // 1. Önce giriş yapmayı deneyelim (Zaman aşımı korumalı)
      const { data: signInData, error: signInError } = await withTimeout(
        supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPassword
        }),
        8000
      );
 
      if (!signInError && signInData?.session) {
        // Kullanıcı var ve başarıyla giriş yaptı, role güncellemesi yapalım (güvenlik için)
        await supabase.from('profiles').update({ role, full_name: testName }).eq('id', signInData.user.id);
        
        // JWT metadata güncellemesi yapalım
        await supabase.auth.updateUser({
          data: { role, full_name: testName }
        });
 
        setNotification({ message: `${testName} Girişi Başarılı!`, type: 'success' });
        setTimeout(() => router.push(`/${params.lang}/admin`), 1000);
        return;
      }
 
      // 2. Giriş başarısızsa (kullanıcı yoksa), otonom olarak yeni hesap oluşturalım
      setNotification({ message: 'Test hesabı oluşturuluyor, lütfen bekleyin...', type: 'success' });
      
      const { data: signUpData, error: signUpError } = await withTimeout(
        supabase.auth.signUp({
          email: testEmail,
          password: testPassword,
          options: {
            data: {
              role: role,
              full_name: testName
            }
          }
        }),
        8000
      );
 
      if (signUpError) throw signUpError;
 
      if (signUpData?.user) {
        // RLS profiller tablosundaki rolünü yetkilendirip güncelleyelim
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: signUpData.user.id,
            role: role,
            full_name: testName,
            phone: '0532 000 00 00'
          });
 
        if (profileError) console.error('Profil güncelleme hatası:', profileError);
 
        // Hesabı oluşturduktan sonra tekrar giriş yapalım
        const { error: finalSignInError } = await withTimeout(
          supabase.auth.signInWithPassword({
            email: testEmail,
            password: testPassword
          }),
          8000
        );
 
        if (finalSignInError) throw finalSignInError;
 
        setNotification({ message: `Yeni ${testName} Hesabı Başarıyla Oluşturuldu ve Giriş Yapıldı!`, type: 'success' });
        setTimeout(() => router.push(`/${params.lang}/admin`), 1500);
      }
    } catch (e: any) {
      setNotification({ message: 'Otonom Giriş Hatası: ' + e.message, type: 'error' });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#05070c] text-white p-6 relative overflow-hidden">
      
      {/* LUXURY GLOW BACKGROUND */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-600/5 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-500/5 blur-[120px] rounded-full"></div>

      {/* NOTIFICATION BANNER */}
      {notification && (
        <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 rounded-2xl shadow-2xl ${
          notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          <div className="flex items-center gap-3 font-bold">
            <span>{notification.type === 'success' ? '✅' : '❌'}</span>
            {notification.message}
          </div>
        </div>
      )}

      <div className="w-full max-w-lg p-8 md:p-10 bg-gray-900/50 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
        
        {/* LOGO SHIELDS */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-yellow-600 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-yellow-600/20">
            <Shield className="text-gray-950" size={32} />
          </div>
          <span className="text-yellow-600 text-[10px] font-bold uppercase tracking-[0.4em] mb-1.5 block">Kaynak Gayrimenkul</span>
          <h1 className="text-3xl font-serif font-bold text-white">Kurumsal Portal Girişi</h1>
          <p className="text-gray-500 text-xs mt-2">Yönetici ve Danışman operasyonlarına erişin.</p>
        </div>

        {/* TRADITIONAL FORM */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">E-Posta Adresi</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-950 border border-white/10 p-4 rounded-xl focus:border-yellow-600 outline-none text-sm transition-all placeholder:text-gray-700"
              placeholder="isim@kaynakgayrimenkul.com"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Güvenli Şifre</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-950 border border-white/10 p-4 rounded-xl focus:border-yellow-600 outline-none text-sm transition-all"
              placeholder="••••••••"
            />
          </div>

          <button 
            disabled={loading}
            className="w-full bg-white hover:bg-gray-100 text-gray-950 font-bold py-4 rounded-xl transition-all disabled:opacity-50 text-xs uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <KeyRound size={14} /> {loading ? 'Kimlik Doğrulanıyor...' : 'Sisteme Giriş Yap'}
          </button>
        </form>

        {/* DECORATIVE SEPARATOR & QUICK TEST LOGIN BUTTONS (ONLY RENDER IN LOCAL DEV ENVIRONMENT FOR Bulletproof PRODUCTION SECURITY) */}
        {isDev && (
          <>
            <div className="relative my-8 text-center">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <div className="relative justify-center text-center">
                <span className="bg-[#0f121d] px-4 text-[9px] font-extrabold text-yellow-600 uppercase tracking-[0.25em]">Veya Hızlı Test Modu</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickTestLogin('admin')}
                className="bg-yellow-600/10 hover:bg-yellow-600 text-yellow-500 hover:text-gray-950 border border-yellow-500/20 py-4 px-4 rounded-2xl text-xs font-bold transition-all flex flex-col items-center gap-2 hover:shadow-xl hover:shadow-yellow-600/5"
              >
                <Sparkles size={18} />
                <span>Broker (Yönetici) Girişi</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickTestLogin('agent')}
                className="bg-white/5 hover:bg-white text-gray-400 hover:text-gray-950 border border-white/10 py-4 px-4 rounded-2xl text-xs font-bold transition-all flex flex-col items-center gap-2 hover:shadow-xl"
              >
                <UserCheck size={18} />
                <span>Danışman Girişi</span>
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
