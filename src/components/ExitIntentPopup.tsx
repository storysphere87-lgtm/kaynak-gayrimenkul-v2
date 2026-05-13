'use client';

import React, { useState, useEffect } from 'react';

export default function ExitIntentPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [canShow, setCanShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setCanShow(true), 5000);
    const handleMouseOut = (e: MouseEvent) => {
      if (canShow && e.clientY <= 0 && !sessionStorage.getItem('exit_popup_shown')) {
        setIsVisible(true);
        sessionStorage.setItem('exit_popup_shown', 'true');
      }
    };
    document.addEventListener('mouseleave', handleMouseOut);
    return () => { document.removeEventListener('mouseleave', handleMouseOut); clearTimeout(timer); };
  }, [canShow]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm" onClick={() => setIsVisible(false)} />
      <div className="relative w-full max-w-md bg-gray-900 border border-white/10 p-8 md:p-12 rounded-[2rem] shadow-2xl text-center overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-yellow-600" />
        {!isSubmitted ? (
          <div>
            <h2 className="text-3xl font-serif mb-4 leading-tight text-white">Gidiyor musunuz?</h2>
            <p className="text-gray-400 mb-8 leading-relaxed">Aradığınızı henüz bulamadıysanız kriterlerinizi bırakın, piyasaya düşmeden size haber verelim.</p>
            <form onSubmit={(e) => { e.preventDefault(); setIsSubmitted(true); setTimeout(() => setIsVisible(false), 3000); }} className="space-y-4">
              <input required type="tel" placeholder="Telefon Numaranız" className="w-full p-4 rounded-xl bg-white/5 border border-white/10 focus:border-yellow-600 outline-none transition-colors text-center text-lg text-white" />
              <button type="submit" className="w-full p-4 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-gray-950 font-bold text-lg transition-all">Beni Arayın</button>
            </form>
          </div>
        ) : (
          <div className="py-8">
            <div className="text-4xl mb-4">💎</div>
            <h2 className="text-2xl font-serif mb-2 text-white">Harika!</h2>
            <p className="text-gray-400">Danışmanlarımız sizi kısa süre içinde bilgilendirecek.</p>
          </div>
        )}
      </div>
    </div>
  );
}
