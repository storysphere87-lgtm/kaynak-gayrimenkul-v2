'use client';

import React, { useState } from 'react';
import { getUserBehaviorProfile } from '@/lib/tracker';

interface ContactFormProps {
  dict: any;
  lang: string;
  districtName?: string;
  propertyId?: string;
  isRtl?: boolean;
}

export default function ContactForm({ dict, lang, districtName, propertyId, isRtl }: ContactFormProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');

    const behaviorData = getUserBehaviorProfile();

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      phone: formData.get('phone'),
      message: formData.get('message'),
      district: districtName,
      property_id: propertyId,
      source: 'Contact Form',
      behavior_data: behaviorData
    };

    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setStatus('success');
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'generate_lead', {
            lead_source: 'Contact Form',
            value: 100,
            currency: 'TRY'
          });
        }
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
  };

  if (status === 'success') {
    const handleWhatsApp = () => {
      const formData = new FormData(document.querySelector('form') as HTMLFormElement);
      const name = formData.get('name');
      const message = formData.get('message');
      const waMessage = `Merhaba, ben ${name}. ${districtName ? districtName + ' bölgesi' : ''} ${propertyId ? propertyId + ' referanslı ilan' : ''} hakkında bilgi almak istiyorum. Mesajım: ${message}`;
      window.open(`https://wa.me/905323530606?text=${encodeURIComponent(waMessage)}`, '_blank');
    };

    return (
      <div className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] text-center animate-in fade-in zoom-in duration-700 shadow-2xl relative overflow-hidden">
        <div className="neural-scan opacity-20" />
        <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 border border-green-500/20 shadow-[0_0_40px_rgba(34,197,94,0.1)]">✓</div>
        <h3 className="text-2xl font-serif text-white mb-2 italic">{dict.successTitle || 'Mesajınız Alındı'}</h3>
        <p className="text-gray-500 text-xs font-light mb-8 max-w-[250px] mx-auto">{dict.successMessage || 'Danışmanlarımız en kısa sürede size dönüş yapacaktır.'}</p>
        
        <div className="flex flex-col gap-4">
          <button 
            onClick={handleWhatsApp}
            className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-5 rounded-2xl text-[10px] uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3"
          >
            <span>WhatsApp ile Hemen Bağlan</span>
          </button>
          <button onClick={() => setStatus('idle')} className="text-white/20 text-[9px] font-bold uppercase tracking-[0.3em] hover:text-white transition-colors">
            Yeni Mesaj Gönder
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input 
        name="name"
        required
        type="text" 
        placeholder={dict.name} 
        className={`w-full bg-gray-950 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-yellow-600 transition-colors ${isRtl ? 'text-right' : ''}`} 
      />
      <input 
        name="phone"
        required
        type="tel" 
        placeholder={dict.phone} 
        className={`w-full bg-gray-950 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-yellow-600 transition-colors ${isRtl ? 'text-right' : ''}`} 
        dir="ltr" 
      />
      <textarea 
        name="message"
        placeholder={dict.message} 
        rows={3} 
        className={`w-full bg-gray-950 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-yellow-600 transition-colors resize-none ${isRtl ? 'text-right' : ''}`}
      ></textarea>
      <button 
        type="submit" 
        disabled={status === 'loading'}
        className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-700 text-black font-bold py-4 rounded-xl transition-all shadow-xl hover:-translate-y-1"
      >
        {status === 'loading' ? '...' : dict.submit}
      </button>
      {status === 'error' && (
        <p className="text-red-500 text-xs text-center">Bir hata oluştu, lütfen tekrar deneyin.</p>
      )}
    </form>
  );
}
