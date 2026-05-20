'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function CookieConsent() {
  const [show, setShow] = useState(false);
  const pathname = usePathname();
  const lang = pathname?.split('/')[1] || 'tr';

  useEffect(() => {
    const consent = localStorage.getItem('quantum_cookie_consent');
    if (!consent) {
      // Delay showing the popup slightly for better UX
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem('quantum_cookie_consent', 'all');
    setShow(false);
    // This allows tracker.ts to start recording behaviors securely
    window.dispatchEvent(new Event('quantum_consent_granted'));
  };

  const rejectTracking = () => {
    localStorage.setItem('quantum_cookie_consent', 'essential');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-[400px] bg-gray-900/90 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl z-[9999] animate-fade-in-up">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-yellow-600 w-6 h-6" />
          <h3 className="text-white font-serif font-bold tracking-wider">Veri & Gizlilik</h3>
        </div>
        <button onClick={rejectTracking} className="text-gray-500 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <p className="text-gray-400 text-xs leading-relaxed mb-6">
        Quantum OS altyapımız, size en uygun lüks gayrimenkulleri sunabilmek için dijital ayak izinizi anonim olarak analiz eder. Detaylı bilgi için <a href={`/${lang}/kvkk`} className="text-yellow-600 underline hover:text-yellow-500">KVKK Aydınlatma Metni</a> ve <a href={`/${lang}/cerez-politikasi`} className="text-yellow-600 underline hover:text-yellow-500">Çerez Politikamızı</a> inceleyebilirsiniz.
      </p>
      
      <div className="flex gap-3">
        <button 
          onClick={rejectTracking}
          className="flex-1 px-4 py-2 text-xs font-bold text-gray-300 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
        >
          SADECE ZORUNLU
        </button>
        <button 
          onClick={acceptAll}
          className="flex-1 px-4 py-2 text-xs font-bold text-gray-900 bg-yellow-600 rounded-lg hover:bg-yellow-500 transition-colors"
        >
          TÜMÜNÜ KABUL ET
        </button>
      </div>
    </div>
  );
}
