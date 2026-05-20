'use client';

import React, { useState } from 'react';
import { loginAction } from './actions';
import { Mail, Lock, ShieldCheck } from 'lucide-react';

export default function AdminLogin() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setError('');
    
    const result = await loginAction(formData);
    
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-[400px] bg-yellow-600/10 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-md bg-white/[0.02] border border-white/10 p-10 rounded-[2rem] shadow-2xl backdrop-blur-xl relative z-10">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-yellow-600/10 border border-yellow-600/30 flex items-center justify-center">
            <ShieldCheck className="text-yellow-600 w-8 h-8" />
          </div>
        </div>
        
        <h1 className="text-3xl font-serif text-white mb-2 text-center">Quantum Yetki Merkezi</h1>
        <p className="text-gray-400 text-center mb-8 text-sm">Danışman veya Yönetici olarak giriş yapın</p>
        
        <form action={handleSubmit} className="space-y-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-500" />
            </div>
            <input 
              type="email" 
              name="email"
              placeholder="Kurumsal E-posta"
              className="w-full bg-gray-900 border border-white/10 p-4 pl-12 rounded-xl text-white outline-none focus:border-yellow-600 transition-colors"
              required
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-500" />
            </div>
            <input 
              type="password" 
              name="password"
              placeholder="Güvenlik Şifresi"
              className="w-full bg-gray-900 border border-white/10 p-4 pl-12 rounded-xl text-white outline-none focus:border-yellow-600 transition-colors"
              required
            />
          </div>
          
          {error && <p className="text-red-400 text-sm text-center bg-red-900/20 p-3 rounded-lg border border-red-900/50">{error}</p>}
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-gray-950 font-bold p-4 rounded-xl transition-all disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {loading ? 'Doğrulanıyor...' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  );
}
