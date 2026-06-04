'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Shield, User, Settings, Lock, Mail, Phone, Plus, Trash2, Key, Save, ArrowLeft, RefreshCw, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { 
  getAllProfilesAction, 
  createAdvisorAction, 
  updateAdvisorAction, 
  deleteAdvisorAction, 
  resetAdvisorPasswordAction 
} from '../actions';

export default function ProfileManagement({ params }: { params: { lang: string } }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | 'advisors' | 'sysusers'>('profile');
  const [userRole, setUserRole] = useState<'admin' | 'agent' | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Profile Roster for Admins
  const [allAdvisors, setAllAdvisors] = useState<any[]>([]);

  // System Users (from Supabase Auth — Admin only)
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [sysUsersLoading, setSysUsersLoading] = useState(false);
  const [sysPasswordMap, setSysPasswordMap] = useState<Record<string, string>>({});
  const [sysPasswordVisible, setSysPasswordVisible] = useState<Record<string, boolean>>({});
  const [sysResetting, setSysResetting] = useState<string | null>(null);

  // Own Profile Form State
  const [ownProfileForm, setOwnProfileForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Broker Create Agent Form State
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    role: 'agent' as 'admin' | 'agent'
  });

  // Password Reset Overlay State
  const [resetModal, setResetModal] = useState<{ show: boolean; userId: string; userName: string; newPassword: '' } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Sistem kullanıcılarını Supabase'den çek (Admin only)
  const fetchSystemUsers = async () => {
    setSysUsersLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success) {
        setSystemUsers(data.users);
      } else {
        setNotification({ message: 'Kullanıcı listesi alınamadı: ' + (data.error || 'Bilinmeyen hata'), type: 'error' });
      }
    } catch (e: any) {
      setNotification({ message: 'API bağlantı hatası: ' + e.message, type: 'error' });
    } finally {
      setSysUsersLoading(false);
    }
  };

  // Sistem kullanıcısının şifresini API ile sıfırla
  const handleSysPasswordReset = async (userId: string, userName: string) => {
    const newPwd = sysPasswordMap[userId];
    if (!newPwd || newPwd.length < 6) {
      setNotification({ message: 'Şifre en az 6 karakter olmalıdır!', type: 'error' });
      return;
    }
    setSysResetting(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newPassword: newPwd }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setNotification({ message: `✅ "${userName}" şifresi başarıyla güncellendi! Artık giriş yapabilir.`, type: 'success' });
      setSysPasswordMap(prev => ({ ...prev, [userId]: '' }));
    } catch (e: any) {
      setNotification({ message: 'Şifre sıfırlama hatası: ' + e.message, type: 'error' });
    } finally {
      setSysResetting(null);
    }
  };

  // Load user data and profile roster
  const fetchSessionAndData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push(`/${params.lang}/admin/login`);
        return;
      }

      // ─── KÖK NEDEN DÜZELTMESİ ─────────────────────────────────────────
      // Eski kod: SADECE JWT metadata.role kontrol ediyordu → rol boşsa null
      // Yeni kod: JWT → profiles tablosu → güvenli fallback (agent) zinciri
      // ──────────────────────────────────────────────────────────────────
      let role: string = session.user.user_metadata?.role || '';

      if (!role || (role !== 'admin' && role !== 'agent')) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();
        role = profileData?.role || '';
      }

      if (!role || (role !== 'admin' && role !== 'agent')) {
        role = 'agent';
      }

      setUserRole(role as 'admin' | 'agent');
      
      // Fetch user profile from public.profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      setCurrentUser({
        id: session.user.id,
        email: session.user.email,
        name: profile?.full_name || session.user.user_metadata?.full_name || 'Danışman',
        phone: profile?.phone || '',
        role: role
      });

      setOwnProfileForm({
        fullName: profile?.full_name || session.user.user_metadata?.full_name || '',
        phone: profile?.phone || '',
        email: session.user.email || '',
        password: '',
        confirmPassword: ''
      });

      // If Broker, load all profiles
      if (role === 'admin') {
        const res = await getAllProfilesAction();
        if (res.success && res.data) {
          setAllAdvisors(res.data);
        }
      }

    } catch (e: any) {
      console.error(e);
      setNotification({ message: 'Profil verileri yüklenemedi.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionAndData();
  }, [params.lang, router]);

  // Handle Current User Profile Update
  const handleUpdateOwnProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // 1. Password change validation
      if (ownProfileForm.password) {
        if (ownProfileForm.password !== ownProfileForm.confirmPassword) {
          throw new Error('Yeni şifreler eşleşmiyor!');
        }
        if (ownProfileForm.password.length < 6) {
          throw new Error('Yeni şifre en az 6 karakter olmalıdır!');
        }
        
        // Update password client-side (safe for currently logged-in user)
        const { error: pwdError } = await supabase.auth.updateUser({
          password: ownProfileForm.password
        });
        if (pwdError) throw pwdError;
      }

      // 2. Update profile details via Server Action (handles email update + profile db update)
      const emailChanged = ownProfileForm.email !== currentUser.email ? ownProfileForm.email : undefined;
      const res = await updateAdvisorAction(
        currentUser.id,
        ownProfileForm.fullName,
        ownProfileForm.phone,
        currentUser.role,
        emailChanged
      );

      if (!res.success) throw new Error(res.error);

      setNotification({ message: 'Profiliniz başarıyla güncellendi!', type: 'success' });
      
      // Update local credentials state
      setCurrentUser((prev: any) => ({
        ...prev,
        name: ownProfileForm.fullName,
        phone: ownProfileForm.phone,
        email: ownProfileForm.email
      }));

      setOwnProfileForm((prev: any) => ({
        ...prev,
        password: '',
        confirmPassword: ''
      }));

      // Refresh data
      fetchSessionAndData();

    } catch (error: any) {
      setNotification({ message: error.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Broker: Create New Advisor
  const handleCreateAdvisor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (createForm.password.length < 6) {
        throw new Error('Şifre en az 6 karakter olmalıdır!');
      }

      const res = await createAdvisorAction(
        createForm.email,
        createForm.password,
        createForm.fullName,
        createForm.phone,
        createForm.role
      );

      if (!res.success) throw new Error(res.error);

      setNotification({ message: 'Yeni Danışman Hesabı Otonom Olarak Başarıyla Oluşturuldu!', type: 'success' });
      
      // Clear Form
      setCreateForm({
        email: '',
        password: '',
        fullName: '',
        phone: '',
        role: 'agent'
      });

      // Reload
      fetchSessionAndData();

    } catch (error: any) {
      setNotification({ message: 'Hesap Oluşturma Hatası: ' + error.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Broker: Delete Advisor Account
  const handleDeleteAdvisor = async (id: string, name: string) => {
    if (id === currentUser.id) {
      alert('Kendi hesabınızı silemezsiniz!');
      return;
    }

    if (!confirm(`"${name}" adlı danışmanın hesabını, yetkilerini ve dijital kartını tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`)) {
      return;
    }

    setSaving(true);
    try {
      const res = await deleteAdvisorAction(id);
      if (!res.success) throw new Error(res.error);

      setNotification({ message: 'Danışman hesabı başarıyla silindi.', type: 'success' });
      fetchSessionAndData();
    } catch (e: any) {
      setNotification({ message: 'Silme hatası: ' + e.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Broker: Overwrite Advisor Password
  const handleResetAdvisorPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModal) return;

    if (resetModal.newPassword.length < 6) {
      alert('Şifre en az 6 karakter olmalıdır!');
      return;
    }

    setSaving(true);
    try {
      const res = await resetAdvisorPasswordAction(resetModal.userId, resetModal.newPassword);
      if (!res.success) throw new Error(res.error);

      setNotification({ message: `"${resetModal.userName}" kullanıcısının şifresi başarıyla güncellendi!`, type: 'success' });
      setResetModal(null);
    } catch (e: any) {
      alert('Şifre sıfırlama hatası: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-20 text-center text-gray-500 font-bold bg-gray-950 min-h-screen">Güvenli Oturum Kontrol Ediliyor...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pt-24 pb-20 relative">
      
      {/* NOTIFICATION BANNER */}
      {notification && (
        <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[150] px-8 py-4 rounded-2xl shadow-2xl ${
          notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          <div className="flex items-center gap-3 font-bold">
            <span>{notification.type === 'success' ? '✅' : '❌'}</span>
            {notification.message}
          </div>
        </div>
      )}

      <div className="container mx-auto px-6 max-w-6xl">
        
        {/* BACK TO DASHBOARD BUTTON */}
        <button 
          onClick={() => router.push(`/${params.lang}/admin`)}
          className="bg-white/5 border border-white/10 hover:border-yellow-600/30 text-gray-400 hover:text-white px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 mb-8 text-xs uppercase tracking-wider"
        >
          <ArrowLeft size={14} /> Panele Geri Dön
        </button>

        {/* HEADER BAR */}
        <div className="mb-12">
          <span className="text-yellow-600 text-xs font-bold uppercase tracking-[0.4em] mb-2 block">Kaynak Gayrimenkul</span>
          <h1 className="text-4xl font-serif font-bold text-white flex items-center gap-3">
            ⚙️ Profil & Yetki Ayarları
          </h1>
          <p className="text-gray-500 text-sm mt-2">Kişisel oturum bilgilerinizi güncelleyin ve danışman ekibini yönetin.</p>
        </div>

        {/* TAB NAVIGATION SELECTOR */}
        <div className="flex flex-wrap gap-3 border-b border-white/5 pb-4 mb-10">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 rounded-xl font-bold transition-all text-xs uppercase tracking-wider flex items-center gap-2 ${
              activeTab === 'profile' 
                ? 'bg-yellow-600 text-gray-950 font-extrabold shadow-lg shadow-yellow-600/10' 
                : 'bg-white/5 border border-white/5 text-gray-400 hover:text-white'
            }`}
          >
            <User size={14} /> Profilim & Şifre Değiştirme
          </button>

          {userRole === 'admin' && (
            <button
              onClick={() => setActiveTab('advisors')}
              className={`px-6 py-3 rounded-xl font-bold transition-all text-xs uppercase tracking-wider flex items-center gap-2 ${
                activeTab === 'advisors' 
                  ? 'bg-yellow-600 text-gray-950 font-extrabold shadow-lg shadow-yellow-600/10' 
                  : 'bg-white/5 border border-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <Shield size={14} /> Danışman Kadrosu ({allAdvisors.length})
            </button>
          )}

          {userRole === 'admin' && (
            <button
              onClick={() => { setActiveTab('sysusers'); fetchSystemUsers(); }}
              className={`px-6 py-3 rounded-xl font-bold transition-all text-xs uppercase tracking-wider flex items-center gap-2 ${
                activeTab === 'sysusers' 
                  ? 'bg-red-600 text-white font-extrabold shadow-lg shadow-red-600/10' 
                  : 'bg-red-950/30 border border-red-500/20 text-red-400 hover:text-white'
              }`}
            >
              <Key size={14} /> ⚠️ Sistem Kullanıcıları & Şifre Sıfırlama
            </button>
          )}
        </div>

        {/* TAB CONTENT GRID */}
        {activeTab === 'sysusers' ? (
          /* ─── SİSTEM KULLANICILARI SEKMESI — BROKER ONLY ─── */
          <div className="space-y-6">
            <div className="bg-red-950/30 border border-red-500/20 rounded-2xl p-5 flex items-start gap-3">
              <AlertTriangle className="text-red-400 flex-shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-red-300 font-bold text-sm mb-1">⚠️ Sistem Yöneticisi Yetkisi Gerektiren Bölge</p>
                <p className="text-red-400/80 text-xs leading-relaxed">
                  Buradan Supabase Auth sistemindeki tüm gerçek kullanıcıları görebilir ve şifrelerini doğrudan sıfırlayabilirsiniz.
                  "Yanlış şifre" sorunu bu ekrandan çözülecektir. Şifre değiştirildikten sonra giriş sayfasına gidin.
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-serif font-bold text-white">Supabase Auth Kullanıcıları ({systemUsers.length})</h2>
              <button
                onClick={fetchSystemUsers}
                disabled={sysUsersLoading}
                className="bg-white/5 border border-white/10 hover:border-yellow-600/30 text-gray-300 hover:text-white px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50"
              >
                <RefreshCw size={12} className={sysUsersLoading ? 'animate-spin' : ''} />
                {sysUsersLoading ? 'Yükleniyor...' : 'Listeyi Yenile'}
              </button>
            </div>

            {sysUsersLoading && systemUsers.length === 0 && (
              <div className="py-16 text-center text-gray-500">
                <div className="w-8 h-8 border-2 border-yellow-600/30 border-t-yellow-600 rounded-full animate-spin mx-auto mb-4" />
                Supabase'den kullanıcılar çekiliyor...
              </div>
            )}

            {!sysUsersLoading && systemUsers.length === 0 && (
              <div className="py-16 text-center text-gray-500 italic text-sm">
                Kullanıcı bulunamadı. "Listeyi Yenile" butonuna tıklayın.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {systemUsers.map((u: any) => (
                <div key={u.id} className="bg-gray-900 border border-white/10 rounded-[2rem] p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-600/3 blur-[40px] rounded-full" />

                  {/* Kullanıcı bilgisi */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className={`text-[8px] font-extrabold uppercase px-2.5 py-1 rounded-full border mb-2 inline-block ${
                        u.role === 'admin' 
                          ? 'bg-purple-600/10 text-purple-400 border-purple-500/20' 
                          : 'bg-cyan-600/10 text-cyan-400 border-cyan-500/20'
                      }`}>
                        {u.role === 'admin' ? 'Admin / Broker' : 'Danışman'}
                      </span>
                      <h4 className="text-base font-serif font-bold text-white">{u.full_name}</h4>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">{u.email}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${
                        u.email_confirmed ? 'bg-green-600/10 text-green-400' : 'bg-orange-600/10 text-orange-400'
                      }`}>
                        {u.email_confirmed ? '✔ E-posta Onayldı' : '⚠ Onay Bekliyor'}
                      </span>
                      {u.last_sign_in && (
                        <p className="text-[9px] text-gray-600 mt-1">
                          Son giriş: {new Date(u.last_sign_in).toLocaleDateString('tr-TR')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Şifre Sıfırlama Alanı */}
                  <div className="border-t border-white/5 pt-4 space-y-3">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Yeni Şifre Belirle
                    </label>
                    <div className="relative">
                      <input
                        type={sysPasswordVisible[u.id] ? 'text' : 'password'}
                        value={sysPasswordMap[u.id] || ''}
                        onChange={e => setSysPasswordMap(prev => ({ ...prev, [u.id]: e.target.value }))}
                        className="w-full bg-gray-950 border border-white/10 pl-4 pr-10 py-3 rounded-xl text-sm text-white focus:border-yellow-600 outline-none transition-all font-mono"
                        placeholder="En az 6 karakter"
                      />
                      <button
                        type="button"
                        onClick={() => setSysPasswordVisible(prev => ({ ...prev, [u.id]: !prev[u.id] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400"
                      >
                        {sysPasswordVisible[u.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    <button
                      onClick={() => handleSysPasswordReset(u.id, u.full_name)}
                      disabled={sysResetting === u.id || !sysPasswordMap[u.id]}
                      className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-gray-950 font-extrabold py-3 rounded-xl transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-40"
                    >
                      {sysResetting === u.id ? (
                        <><RefreshCw size={12} className="animate-spin" /> Güncelleniyor...</>
                      ) : (
                        <><Key size={12} /> Şifre Kaydet & Aktif Et</>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'profile' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* LEFT: PERSONAL PROFILE FORM */}
            <div className="lg:col-span-7 bg-gray-900 border border-white/10 p-8 md:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-600/5 blur-[50px] rounded-full"></div>
              
              <h2 className="text-2xl font-serif font-bold text-white mb-6 flex items-center gap-2">
                <Settings size={20} className="text-cyan-500" /> Profil Bilgilerimi Güncelle
              </h2>

              <form onSubmit={handleUpdateOwnProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><User size={12} /> Ad Soyad</label>
                    <input 
                      required 
                      type="text" 
                      value={ownProfileForm.fullName} 
                      onChange={e => setOwnProfileForm({...ownProfileForm, fullName: e.target.value})} 
                      className="w-full bg-gray-950 border border-white/10 p-3.5 rounded-xl text-white focus:border-cyan-500 outline-none text-sm transition-all" 
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Phone size={12} /> Telefon Numarası</label>
                    <input 
                      required 
                      type="text" 
                      value={ownProfileForm.phone} 
                      onChange={e => setOwnProfileForm({...ownProfileForm, phone: e.target.value})} 
                      className="w-full bg-gray-950 border border-white/10 p-3.5 rounded-xl text-white focus:border-cyan-500 outline-none text-sm transition-all font-mono" 
                      placeholder="0532 000 00 00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Mail size={12} /> Oturum E-Posta Adresi</label>
                  <input 
                    required 
                    type="email" 
                    value={ownProfileForm.email} 
                    onChange={e => setOwnProfileForm({...ownProfileForm, email: e.target.value})} 
                    className="w-full bg-gray-950 border border-white/10 p-3.5 rounded-xl text-white focus:border-cyan-500 outline-none text-sm transition-all font-mono" 
                  />
                  <span className="text-[10px] text-gray-600 mt-2 block">E-postanızı değiştirdiğinizde bir dahaki girişiniz yeni e-posta adresiyle yapılacaktır.</span>
                </div>

                <div className="border-t border-white/5 pt-6 my-6 space-y-6">
                  <h3 className="text-sm font-bold text-yellow-500 flex items-center gap-2">
                    <Lock size={14} /> Şifre Değiştir (İsteğe Bağlı)
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Yeni Şifre</label>
                      <input 
                        type="password" 
                        value={ownProfileForm.password} 
                        onChange={e => setOwnProfileForm({...ownProfileForm, password: e.target.value})} 
                        className="w-full bg-gray-950 border border-white/10 p-3.5 rounded-xl text-white focus:border-yellow-600 outline-none text-sm transition-all" 
                        placeholder="Güvenli Yeni Şifre"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Yeni Şifre Tekrar</label>
                      <input 
                        type="password" 
                        value={ownProfileForm.confirmPassword} 
                        onChange={e => setOwnProfileForm({...ownProfileForm, confirmPassword: e.target.value})} 
                        className="w-full bg-gray-950 border border-white/10 p-3.5 rounded-xl text-white focus:border-yellow-600 outline-none text-sm transition-all" 
                        placeholder="Yeni Şifre Tekrar"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  disabled={saving} 
                  className="w-full bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-gray-950 font-extrabold py-4 rounded-xl transition-all shadow-xl shadow-cyan-600/10 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Save size={16} /> {saving ? 'Güncelleniyor...' : 'Profil Ayarlarımı Kaydet'}
                </button>
              </form>
            </div>

            {/* RIGHT: PORTAL ACCOUNT PREVIEW CARD */}
            <div className="lg:col-span-5 bg-gray-900 border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-600/5 blur-[50px] rounded-full"></div>
              
              <div>
                <span className="bg-yellow-600/10 border border-yellow-600/20 text-yellow-500 text-[9px] font-extrabold px-3 py-1.5 uppercase tracking-widest rounded-full inline-block mb-6">
                  {currentUser.role === 'admin' ? 'YÖNETİCİ HESABI (BROKER)' : 'SAHA DANIŞMANI'}
                </span>
                
                <h3 className="text-2xl font-serif font-bold text-white mb-2">{currentUser.name}</h3>
                <p className="text-xs text-gray-500 mb-6 font-mono">{currentUser.email}</p>
                
                <div className="space-y-3.5 border-t border-white/5 pt-6 text-sm text-gray-400">
                  <div className="flex justify-between">
                    <span className="text-[10px] uppercase font-bold text-gray-500">Yetki Seviyesi:</span>
                    <span className="text-white font-bold">{currentUser.role === 'admin' ? 'Broker / Sistem Yöneticisi' : 'Gayrimenkul Danışmanı'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] uppercase font-bold text-gray-500">Telefon:</span>
                    <span className="text-white font-mono">{currentUser.phone || 'Girilmedi'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] uppercase font-bold text-gray-500">Durum:</span>
                    <span className="text-green-500 font-bold flex items-center gap-1.5">🟢 Aktif Oturum</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-950 border border-white/5 p-4 rounded-2xl text-xs text-gray-500 italic mt-8">
                "Her danışmanın portfolyo düzenlemeleri, sosyal medya görsel taslakları ve Kanban CRM evrak havuzu bu hesap bilgileri ile güvenliğe alınmaktadır."
              </div>
            </div>
          </div>
        ) : (
          /* ADVISORS ROSTER TAB - BROKER ONLY */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* LEFT: ROSTER & GRID */}
            <div className="lg:col-span-7 space-y-6">
              <h2 className="text-2xl font-serif font-bold text-white mb-6 flex items-center gap-2">
                📋 Mevcut Gayrimenkul Danışmanları
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {allAdvisors.length === 0 && <p className="text-gray-500 italic text-xs">Sistemde henüz danışman bulunmuyor.</p>}
                {allAdvisors.map((adv: any) => (
                  <div key={adv.id} className="bg-gray-900 border border-white/10 p-6 rounded-[2rem] shadow-2xl relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-600/5 blur-[40px] rounded-full"></div>
                    
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className={`text-[8px] font-extrabold uppercase px-2.5 py-1 rounded-full border mb-2 inline-block
                            ${adv.role === 'admin' 
                              ? 'bg-purple-600/10 text-purple-400 border-purple-500/20' 
                              : 'bg-cyan-600/10 text-cyan-400 border-cyan-500/20'}`}>
                            {adv.role === 'admin' ? 'Broker' : 'Danışman'}
                          </span>
                          <h4 className="text-base font-serif font-bold text-white">{adv.full_name || 'İsimsiz'}</h4>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-gray-400 mb-6">
                        <p className="flex items-center gap-2 font-mono text-[10px] text-gray-500">ID: {adv.id}</p>
                        {adv.phone && <p className="flex items-center gap-2 text-white">📞 {adv.phone}</p>}
                      </div>
                    </div>

                    <div className="flex gap-2 border-t border-white/5 pt-4">
                      <button
                        onClick={() => setResetModal({ show: true, userId: adv.id, userName: adv.full_name || 'Danışman', newPassword: '' })}
                        className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1"
                      >
                        <Key size={10} /> Şifre Sıfırla
                      </button>
                      
                      {adv.id !== currentUser.id && (
                        <button
                          onClick={() => handleDeleteAdvisor(adv.id, adv.full_name)}
                          className="bg-red-950 hover:bg-red-800 border border-red-500/20 text-red-400 hover:text-white p-2.5 rounded-xl text-xs font-bold transition-all"
                          title="Hesabı Tamamen Sil"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: CREATE DANIŞMAN FORM */}
            <div className="lg:col-span-5 bg-gray-900 border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden h-fit">
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-600/5 blur-[50px] rounded-full"></div>
              
              <h2 className="text-xl font-serif font-bold text-white mb-2 flex items-center gap-2">
                <Plus className="text-yellow-500" size={18} /> Yeni Danışman Ekle
              </h2>
              <p className="text-xs text-gray-500 mb-6">Ofis kadrosuna otonom e-posta onaylı şifreyle anında giriş yapabilecek bir hesap ekleyin.</p>

              <form onSubmit={handleCreateAdvisor} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Adı Soyadı</label>
                  <input 
                    required 
                    type="text" 
                    value={createForm.fullName} 
                    onChange={e => setCreateForm({...createForm, fullName: e.target.value})} 
                    className="w-full bg-gray-950 border border-white/10 p-3 rounded-xl text-xs text-white focus:border-yellow-600 outline-none transition-all" 
                    placeholder="Ahmet Yılmaz"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Telefon Numarası</label>
                  <input 
                    required 
                    type="text" 
                    value={createForm.phone} 
                    onChange={e => setCreateForm({...createForm, phone: e.target.value})} 
                    className="w-full bg-gray-950 border border-white/10 p-3 rounded-xl text-xs text-white focus:border-yellow-600 outline-none transition-all font-mono" 
                    placeholder="0532 111 22 33"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">E-Posta Adresi</label>
                  <input 
                    required 
                    type="email" 
                    value={createForm.email} 
                    onChange={e => setCreateForm({...createForm, email: e.target.value})} 
                    className="w-full bg-gray-950 border border-white/10 p-3 rounded-xl text-xs text-white focus:border-yellow-600 outline-none transition-all font-mono" 
                    placeholder="danisman@kaynakgayrimenkul.com"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Geçici Oturum Şifresi</label>
                  <input 
                    required 
                    type="password" 
                    value={createForm.password} 
                    onChange={e => setCreateForm({...createForm, password: e.target.value})} 
                    className="w-full bg-gray-950 border border-white/10 p-3 rounded-xl text-xs text-white focus:border-yellow-600 outline-none transition-all" 
                    placeholder="En az 6 karakter"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Sistem Yetki Rolü</label>
                  <select 
                    value={createForm.role} 
                    onChange={e => setCreateForm({...createForm, role: e.target.value as 'admin' | 'agent'})}
                    className="w-full bg-gray-950 border border-white/10 p-3 rounded-xl text-xs text-white focus:border-yellow-600 outline-none transition-all cursor-pointer"
                  >
                    <option value="agent">Gayrimenkul Danışmanı (Agent)</option>
                    <option value="admin">Broker / Sistem Yöneticisi (Admin)</option>
                  </select>
                </div>

                <button 
                  disabled={saving} 
                  className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-gray-950 font-extrabold py-3.5 rounded-xl transition-all shadow-xl shadow-yellow-600/10 text-xs uppercase tracking-wider flex items-center justify-center gap-2 mt-4"
                >
                  <Plus size={14} /> {saving ? 'Hesap Oluşturuluyor...' : 'Danışman Hesabı Oluştur'}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>

      {/* OVERWRITE PASSWORD RESET MODAL */}
      {resetModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-gray-900 border border-white/10 p-8 rounded-[3.5rem] w-full max-w-sm relative shadow-2xl">
            <h3 className="text-xl font-serif text-white mb-2 flex items-center gap-2"><Key className="text-yellow-500" size={18} /> Şifre Güncelle</h3>
            <p className="text-xs text-gray-500 mb-6">"{resetModal.userName}" kullanıcısının oturum şifresini yeni bir şifreyle anında değiştirin.</p>
            
            <form onSubmit={handleResetAdvisorPassword} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Yeni Şifre</label>
                <input 
                  required
                  type="password" 
                  value={resetModal.newPassword}
                  onChange={(e) => setResetModal({ ...resetModal, newPassword: e.target.value as any })}
                  className="w-full bg-gray-950 border border-white/10 p-4 rounded-xl focus:border-yellow-600 outline-none text-sm transition-all"
                  placeholder="Minimum 6 Karakter"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setResetModal(null)}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                >
                  Vazgeç
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-gray-950 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                >
                  {saving ? 'Güncelleniyor...' : 'Şifreyi Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
