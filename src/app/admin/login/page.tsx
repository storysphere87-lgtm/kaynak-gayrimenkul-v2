'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (res.ok) {
        router.push('/admin');
        router.refresh();
      } else {
        setError('Hatalı şifre');
      }
    } catch (err) {
      setError('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/5 border border-white/10 p-10 rounded-[2rem] shadow-2xl backdrop-blur-xl">
        <h1 className="text-3xl font-serif text-white mb-2 text-center">Merkez Üs</h1>
        <p className="text-gray-400 text-center mb-8 text-sm">Devam etmek için yetkilendirme gerekiyor</p>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <input 
              type="password" 
              placeholder="Erişim Şifresi"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-900 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-yellow-600 transition-colors text-center text-xl tracking-widest"
              required
            />
          </div>
          
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-yellow-600 hover:bg-yellow-500 text-gray-950 font-bold p-4 rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? 'Doğrulanıyor...' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  );
}
