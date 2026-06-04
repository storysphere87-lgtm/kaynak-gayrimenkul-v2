'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Shield, KeyRound, Mail, Lock, Eye, EyeOff, ArrowLeft, Send, RefreshCw } from 'lucide-react';

type Tab = 'login' | 'forgot' | 'emergency';

export default function AdminLogin({ params }: { params: { lang: string } }) {
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // ─── ZAMAN AŞIMI KORUMALARI ─────────────────────────────────────────────────
  function withTimeout<T>(promise: Promise<T>, ms = 10000): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Sunucu bağlantısı zaman aşımına uğradı. Lütfen internet bağlantınızı kontrol edin.')), ms)
      ),
    ]);
  }

  // ─── ACİL DURUM ŞİFRE SIFIRLAMA MANTIĞI ──────────────────────────────────────
  const [systemKey, setSystemKey] = useState('');
  const [emergencyUsers, setEmergencyUsers] = useState<any[]>([]);
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const [emergencyPasswords, setEmergencyPasswords] = useState<Record<string, string>>({});
  const [emergencyResetting, setEmergencyResetting] = useState<string | null>(null);

  const handleLoadEmergencyUsers = async () => {
    if (!systemKey.trim()) return;
    setEmergencyLoading(true);
    setNotification(null);
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'x-system-key': systemKey.trim() },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Sistem anahtarı geçersiz.');
      }
      setEmergencyUsers(data.users || []);
      setNotification({ message: 'Kullanıcı listesi başarıyla yüklendi.', type: 'success' });
    } catch (err: any) {
      setNotification({ message: err.message, type: 'error' });
    } finally {
      setEmergencyLoading(false);
    }
  };

  const handleResetEmergencyPassword = async (userId: string, userName: string) => {
    const newPwd = emergencyPasswords[userId];
    if (!newPwd || newPwd.length < 6) {
      setNotification({ message: 'Şifre en az 6 karakter olmalıdır!', type: 'error' });
      return;
    }
    setEmergencyResetting(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-system-key': systemKey.trim()
        },
        body: JSON.stringify({ userId, newPassword: newPwd }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Şifre sıfırlanamadı.');
      }
      setNotification({ message: `✅ "${userName}" şifresi başarıyla sıfırlandı. Giriş yapabilirsiniz.`, type: 'success' });
      setEmergencyPasswords(prev => ({ ...prev, [userId]: '' }));
    } catch (err: any) {
      setNotification({ message: err.message, type: 'error' });
    } finally {
      setEmergencyResetting(null);
    }
  };

  // ─── ANA GİRİŞ MANTIĞI ─────────────────────────────────────────────────────
  // KÖK NEDEN DÜZELTMESİ:
  // 1. Supabase auth.signInWithPassword başarılı olur.
  // 2. user_metadata.role kontrol edilir. Eğer yoksa → profiles tablosuna bakılır.
  // 3. profiles tablosunda da yoksa → kullanıcı "agent" olarak kabul edilir (güvenli fallback).
  // 4. Bu sayede "doğru şifre ama giriş yapılamıyor" sorunu tamamen çözülür.
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotification(null);

    try {
      // ADIM 1: Kimlik doğrulama
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({ email: email.trim(), password }),
        10000
      );

      if (error) {
        // Supabase İngilizce hata mesajlarını Türkçeye çevir
        const errorMap: Record<string, string> = {
          'Invalid login credentials': 'E-posta adresi veya şifre hatalı. Lütfen tekrar deneyin.',
          'Email not confirmed': 'E-posta adresiniz henüz onaylanmamış.',
          'Too many requests': 'Çok fazla deneme yapıldı. Birkaç dakika bekleyip tekrar deneyin.',
          'User not found': 'Bu e-posta ile kayıtlı kullanıcı bulunamadı.',
        };
        const turkishError = errorMap[error.message] || `Giriş hatası: ${error.message}`;
        throw new Error(turkishError);
      }

      if (!data?.session || !data?.user) {
        throw new Error('Oturum oluşturulamadı. Lütfen tekrar deneyin.');
      }

      const user = data.user;

      // ADIM 2: Rol tespiti — JWT metadata → profiles tablosu → güvenli fallback
      let role: string = user.user_metadata?.role || '';

      if (!role || (role !== 'admin' && role !== 'agent')) {
        // JWT'de rol yok, profiles tablosuna bak
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        role = profile?.role || '';
      }

      // ADIM 3: Hâlâ rol yoksa JWT metadata'yı "agent" olarak güncelle ve devam et
      if (!role || (role !== 'admin' && role !== 'agent')) {
        // Bu kullanıcının profiles tablosunda kaydı yok veya role boş.
        // Güvenli fallback: agent olarak giriş yaptır + metadata'ya yaz
        const { error: updateError } = await supabase.auth.updateUser({
          data: { role: 'agent', full_name: user.user_metadata?.full_name || email.split('@')[0] }
        });
        if (updateError) console.warn('Metadata güncellenemedi:', updateError.message);

        // Profiles tablosuna da yaz
        await supabase.from('profiles').upsert({
          id: user.id,
          role: 'agent',
          full_name: user.user_metadata?.full_name || email.split('@')[0],
        });

        role = 'agent';
      }

      setNotification({ message: `✅ Giriş başarılı! ${role === 'admin' ? 'Yönetici' : 'Danışman'} paneli açılıyor...`, type: 'success' });

      // ADIM 4: Role göre yönlendirme
      setTimeout(() => {
        if (role === 'admin') {
          router.push(`/${params.lang}/admin`);
        } else {
          router.push(`/${params.lang}/admin/pipeline`);
        }
      }, 800);

    } catch (error: any) {
      setNotification({ message: error.message, type: 'error' });
      setLoading(false);
    }
  };

  // ─── ŞİFREMİ UNUTTUM ─────────────────────────────────────────────────────
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotification(null);

    try {
      if (!resetEmail.trim()) throw new Error('Lütfen kayıtlı e-posta adresinizi girin.');

      const { error } = await withTimeout(
        supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
          redirectTo: `${window.location.origin}/${params.lang}/admin/login?reset=true`,
        }),
        10000
      );

      if (error) throw new Error(`Şifre sıfırlama hatası: ${error.message}`);

      setNotification({
        message: `Şifre sıfırlama bağlantısı "${resetEmail}" adresine gönderildi. Lütfen e-postanızı kontrol edin (Spam klasörünü de kontrol edin).`,
        type: 'success',
      });
      setResetEmail('');

    } catch (error: any) {
      setNotification({ message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#05070c] text-white p-6 relative overflow-hidden">

      {/* ARKA PLAN GLOW EFEKTI */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-yellow-600/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-yellow-500/3 blur-[120px] rounded-full pointer-events-none" />

      {/* BİLDİRİM BANNER */}
      {notification && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] max-w-lg w-full mx-4 px-6 py-4 rounded-2xl shadow-2xl border transition-all ${
          notification.type === 'success'
            ? 'bg-green-950 border-green-500/30 text-green-300'
            : notification.type === 'error'
            ? 'bg-red-950 border-red-500/30 text-red-300'
            : 'bg-blue-950 border-blue-500/30 text-blue-300'
        }`}>
          <p className="text-sm font-semibold leading-relaxed">{notification.message}</p>
        </div>
      )}

      <div className="w-full max-w-md relative z-10">

        {/* LOGO VE BAŞLIK */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-600 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-yellow-600/30">
            <Shield className="text-gray-950" size={30} />
          </div>
          <span className="text-yellow-600 text-[10px] font-extrabold uppercase tracking-[0.4em] mb-2 block">
            Kaynak Gayrimenkul
          </span>
          <h1 className="text-3xl font-serif font-bold text-white">
            {tab === 'login' ? 'Kurumsal Portal' : 'Şifre Sıfırlama'}
          </h1>
          <p className="text-gray-500 text-xs mt-2">
            {tab === 'login'
              ? 'Yönetici ve Danışman paneline güvenli erişim.'
              : 'Kayıtlı e-posta adresinize sıfırlama bağlantısı göndereceğiz.'}
          </p>
        </div>

        {/* KART */}
        <div className="bg-gray-900/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">

          {/* ─── GİRİŞ FORMU ─── */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  E-Posta Adresi
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-gray-950 border border-white/10 pl-11 pr-4 py-4 rounded-xl focus:border-yellow-600 outline-none text-sm transition-all placeholder:text-gray-700 text-white"
                    placeholder="isim@kaynakgayrimenkul.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Şifre
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-gray-950 border border-white/10 pl-11 pr-12 py-4 rounded-xl focus:border-yellow-600 outline-none text-sm transition-all text-white"
                    placeholder="••••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* ŞİFREMİ UNUTTUM & ACİL SIFIRLAMA LİNKLERİ */}
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => { setTab('emergency'); setNotification(null); }}
                  className="text-xs text-red-500 hover:text-red-400 transition-colors font-bold flex items-center gap-1"
                >
                  ⚡ Acil Şifre Sıfırlama
                </button>
                <button
                  type="button"
                  onClick={() => { setTab('forgot'); setNotification(null); }}
                  className="text-xs text-gray-500 hover:text-yellow-500 transition-colors font-bold"
                >
                  Şifremi Unuttum →
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                id="login-submit-btn"
                className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-gray-950 font-extrabold py-4 rounded-xl transition-all shadow-xl shadow-yellow-600/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-sm uppercase tracking-wide"
              >
                <KeyRound size={16} />
                {loading ? 'Kimlik Doğrulanıyor...' : 'Sisteme Giriş Yap'}
              </button>
            </form>
          )}

          {/* ─── ŞİFREMİ UNUTTUM FORMU ─── */}
          {tab === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Kayıtlı E-Posta Adresiniz
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    className="w-full bg-gray-950 border border-white/10 pl-11 pr-4 py-4 rounded-xl focus:border-yellow-600 outline-none text-sm transition-all placeholder:text-gray-700 text-white"
                    placeholder="isim@kaynakgayrimenkul.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="bg-yellow-950/40 border border-yellow-600/20 rounded-xl p-4 text-xs text-yellow-400/80 leading-relaxed">
                📧 Supabase üzerinden kayıtlı e-posta adresinize bir şifre sıfırlama bağlantısı gönderilecek. 
                Bağlantıya tıkladıktan sonra yeni şifrenizi belirleyebilirsiniz.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-gray-950 font-extrabold py-4 rounded-xl transition-all shadow-xl shadow-yellow-600/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-sm uppercase tracking-wide"
              >
                <Send size={16} />
                {loading ? 'Bağlantı Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
              </button>

              <button
                type="button"
                onClick={() => { setTab('login'); setNotification(null); }}
                className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors py-2"
              >
                <ArrowLeft size={12} /> Giriş Sayfasına Dön
              </button>
            </form>
          )}

          {/* ─── ACİL DURUM ŞİFRE SIFIRLAMA FORMU ─── */}
          {tab === 'emergency' && (
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 text-left">
                  Sistem Güvenlik Anahtarı
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                  <input
                    type="password"
                    value={systemKey}
                    onChange={e => setSystemKey(e.target.value)}
                    className="w-full bg-gray-950 border border-white/10 pl-11 pr-4 py-4 rounded-xl focus:border-red-500 outline-none text-sm transition-all placeholder:text-gray-700 text-white font-mono"
                    placeholder="Sistem anahtarını girin"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleLoadEmergencyUsers}
                disabled={emergencyLoading || !systemKey}
                className="w-full bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-extrabold py-4 rounded-xl transition-all shadow-xl shadow-red-950/20 active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2 text-sm uppercase tracking-wide"
              >
                <RefreshCw size={16} className={emergencyLoading ? 'animate-spin' : ''} />
                {emergencyLoading ? 'Kullanıcılar Çekiliyor...' : 'Kullanıcı Listesini Yükle'}
              </button>

              {emergencyUsers.length > 0 && (
                <div className="border-t border-white/10 pt-4 space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  <p className="text-xs font-bold text-red-400 text-left">Sistem Kullanıcıları:</p>
                  {emergencyUsers.map((u: any) => (
                    <div key={u.id} className="bg-gray-950 border border-white/5 p-4 rounded-xl space-y-3 text-left">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-bold text-white">{u.full_name}</p>
                          <p className="text-[10px] text-gray-500 font-mono">{u.email}</p>
                        </div>
                        <span className="text-[9px] uppercase px-2 py-0.5 rounded bg-gray-900 border border-white/10 text-gray-400">
                          {u.role === 'admin' ? 'Admin' : 'Danışman'}
                        </span>
                      </div>
                      
                      <div className="relative">
                        <input
                          type="text"
                          value={emergencyPasswords[u.id] || ''}
                          onChange={e => setEmergencyPasswords(prev => ({ ...prev, [u.id]: e.target.value }))}
                          className="w-full bg-gray-900 border border-white/10 pl-3 pr-3 py-2 rounded-lg text-xs text-white focus:border-red-500 outline-none transition-all font-mono"
                          placeholder="Yeni Şifre girin"
                        />
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => handleResetEmergencyPassword(u.id, u.full_name)}
                        disabled={emergencyResetting === u.id || !emergencyPasswords[u.id]}
                        className="w-full bg-white/5 hover:bg-white/10 text-red-400 hover:text-red-300 border border-red-500/20 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 disabled:opacity-40"
                      >
                        {emergencyResetting === u.id ? 'Sıfırlanıyor...' : 'Şifreyi Güncelle'}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => { setTab('login'); setNotification(null); }}
                className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors py-2"
              >
                <ArrowLeft size={12} /> Giriş Sayfasına Dön
              </button>
            </div>
          )}

        </div>

        {/* ALT BİLGİ */}
        <p className="text-center text-[10px] text-gray-700 mt-6 font-mono">
          Kaynak Gayrimenkul Quantum OS — Güvenli Portal v2
        </p>
      </div>
    </div>
  );
}
