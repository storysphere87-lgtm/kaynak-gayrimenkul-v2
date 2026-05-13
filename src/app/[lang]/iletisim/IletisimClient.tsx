'use client';

import React, { useState } from 'react';
import { siteConfig } from '@/config/site';

export default function IletisimClient({ dict, lang }: { dict: any, lang: string }) {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const isRtl = lang === 'ar';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          district: 'Genel İletişim',
          propertyType: 'İletişim Sayfası Formu',
          budget: 'N/A'
        })
      });

      if (response.ok) {
        setStatus('success');
        setFormData({ name: '', phone: '', email: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
  };

  return (
    <div className={`pt-32 pb-20 bg-gray-950 min-h-screen ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-6">
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-20 items-start ${isRtl ? 'lg:flex-row-reverse' : ''}`}>
          
          {/* SOL: KURUMSAL BİLGİLER */}
          <div className={`${isRtl ? 'text-right' : 'text-left'} animate-in fade-in slide-in-from-left-10 duration-1000`}>
            <span className="text-yellow-600 text-xs font-bold tracking-[0.4em] uppercase mb-6 block">{dict.badge}</span>
            <h1 className="text-5xl md:text-8xl mb-8 font-serif text-white leading-tight" dangerouslySetInnerHTML={{ __html: dict.title }}></h1>
            <p className="text-gray-400 text-xl mb-16 leading-relaxed">{dict.description}</p>
            
            <div className="space-y-12 mb-16">
              <div className={`flex gap-8 items-center group ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl text-yellow-500 group-hover:bg-yellow-600/20 transition-all">📍</div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-2 font-bold">{dict.addressLabel}</div>
                  <div className="text-white text-xl font-medium">{siteConfig.contact.address}</div>
                </div>
              </div>
              <div className={`flex gap-8 items-center group ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl text-yellow-500 group-hover:bg-yellow-600/20 transition-all">📞</div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-2 font-bold">{dict.phoneLabel}</div>
                  <a href={`tel:${siteConfig.contact.phoneUrl}`} className="text-white text-xl font-medium hover:text-yellow-500 transition-colors" dir="ltr">
                    {siteConfig.contact.phone}
                  </a>
                </div>
              </div>
              <div className={`flex gap-8 items-center group ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl text-yellow-500 group-hover:bg-yellow-600/20 transition-all">✉️</div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-2 font-bold">{dict.emailLabel}</div>
                  <a href={`mailto:${siteConfig.contact.email}`} className="text-white text-xl font-medium hover:text-yellow-500 transition-colors">
                    {siteConfig.contact.email}
                  </a>
                </div>
              </div>
            </div>

            {/* LUXURY GOOGLE MAPS EMBED */}
            <div className="w-full h-80 rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl relative group grayscale contrast-125 opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-1000">
               <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d195884.30043125697!2d32.61054350170464!3d39.90355566601438!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14d347d52073281d%3A0x7b3f61bf1afa48ba!2s%C3%87ankaya%2FAnkara!5e0!3m2!1str!2str!4v1715000000000!5m2!1str!2str" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={false} 
                loading="lazy">
              </iframe>
              <div className="absolute inset-0 pointer-events-none border-[20px] border-gray-950/20 rounded-[3rem]"></div>
            </div>
          </div>

          {/* SAĞ: İLETİŞİM FORMU (Glassmorphism) */}
          <div className="bg-white/5 border border-white/10 p-12 md:p-16 rounded-[4rem] backdrop-blur-3xl shadow-2xl animate-in fade-in slide-in-from-right-10 duration-1000">
            <h3 className={`text-4xl mb-12 font-serif text-white ${isRtl ? 'text-right' : 'text-left'}`}>{dict.formTitle}</h3>
            
            {status === 'success' ? (
              <div className="bg-green-500/10 border border-green-500/50 text-green-500 p-12 rounded-[3rem] text-center">
                <div className="text-6xl mb-6">✨</div>
                <h4 className="text-2xl font-bold mb-4">{dict.formSuccess}</h4>
                <p className="text-lg opacity-80">{dict.formSuccessSub}</p>
                <button onClick={() => setStatus('idle')} className="mt-10 bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-xl transition-all">
                  {dict.newMsg || 'Yeni Mesaj Gönder'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className={`text-[10px] uppercase tracking-[0.3em] text-gray-500 font-bold px-4 ${isRtl ? 'text-right block' : ''}`}>{dict.name}</label>
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder={dict.namePlaceholder} 
                      className={`w-full bg-gray-900/50 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-yellow-600 transition-all ${isRtl ? 'text-right' : ''}`} 
                    />
                  </div>
                  <div className="space-y-3">
                    <label className={`text-[10px] uppercase tracking-[0.3em] text-gray-500 font-bold px-4 ${isRtl ? 'text-right block' : ''}`}>{dict.phone}</label>
                    <input 
                      required
                      type="tel" 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="+90" 
                      className={`w-full bg-gray-900/50 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-yellow-600 transition-all ${isRtl ? 'text-right' : ''}`} 
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className={`text-[10px] uppercase tracking-[0.3em] text-gray-500 font-bold px-4 ${isRtl ? 'text-right block' : ''}`}>{dict.email}</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder={dict.emailPlaceholder} 
                    className={`w-full bg-gray-900/50 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-yellow-600 transition-all ${isRtl ? 'text-right' : ''}`} 
                  />
                </div>
                <div className="space-y-3">
                  <label className={`text-[10px] uppercase tracking-[0.3em] text-gray-500 font-bold px-4 ${isRtl ? 'text-right block' : ''}`}>{dict.message}</label>
                  <textarea 
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    rows={5} 
                    placeholder={dict.messagePlaceholder} 
                    className={`w-full bg-gray-900/50 border border-white/10 p-5 rounded-3xl text-white outline-none focus:border-yellow-600 transition-all resize-none ${isRtl ? 'text-right' : ''}`}
                  ></textarea>
                </div>
                <button 
                  disabled={status === 'loading'}
                  className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-gray-950 font-bold py-6 rounded-3xl text-xl mt-4 transition-all shadow-2xl hover:-translate-y-2 active:scale-95"
                >
                  {status === 'loading' ? dict.sending : dict.submit}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
