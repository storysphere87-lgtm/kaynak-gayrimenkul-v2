'use client';

import React, { useState, useEffect } from 'react';
import { trackPropertyVisit } from '@/lib/tracker';

interface PropertyGalleryProps {
  images: string[];
  externalUrl?: string;
  propertyTitle: string;
  propertyId: string;
  price: number;
  district: string;
}

export default function PropertyGallery({ images, externalUrl, propertyTitle, propertyId, price, district }: PropertyGalleryProps) {
  const [activeTab, setActiveTab] = useState<'photos' | '3d'>('photos');
  const [mainIndex, setMainIndex] = useState(0);

  // Otomatik Dil Algılama (URL veya pathname üzerinden pratik çözüm)
  const isEn = typeof window !== 'undefined' && window.location.pathname.startsWith('/en');
  const isAr = typeof window !== 'undefined' && window.location.pathname.startsWith('/ar');
  const lang = isEn ? 'en' : isAr ? 'ar' : 'tr';

  const t = {
    tr: {
      photos: 'Fotoğraflar',
      virtualTour: '3D Sanal Tur',
      preparing: '3D Sanal Tur Hazırlanıyor',
      desc: 'Bu lüks portföy için Matterport 3D tarama ve sanal modelleme süreci devam etmektedir. En kısa sürede yayına alınacaktır.'
    },
    en: {
      photos: 'Photos',
      virtualTour: '3D Virtual Tour',
      preparing: '3D Virtual Tour is Preparing',
      desc: 'Matterport 3D scanning and virtual modeling process is ongoing for this luxury portfolio. It will be published as soon as possible.'
    },
    ar: {
      photos: 'الصور',
      virtualTour: 'جولة افتراضية ثلاثية الأبعاد',
      preparing: 'يتم تجهيز الجولة الافتراضية',
      desc: 'جاري عمل المسح الثلاثي الأبعاد لهذه المحفظة الفاخرة. سيتم نشرها في أقرب وقت ممكن.'
    }
  };

  useEffect(() => {
    trackPropertyVisit({
      id: propertyId,
      price,
      district
    });
  }, [propertyId, price, district]);

  return (
    <div className="space-y-6">
      {/* Dynamic Tab Controls */}
      <div className="flex gap-4 border-b border-white/5 pb-4 print:hidden">
        <button 
          onClick={() => setActiveTab('photos')}
          className={`px-8 py-3 rounded-2xl font-bold transition-all text-xs uppercase tracking-widest ${
            activeTab === 'photos' 
              ? 'bg-yellow-600 text-gray-950 shadow-lg' 
              : 'bg-white/5 text-white hover:bg-white/10'
          }`}
        >
          📸 {t[lang].photos} ({images.length})
        </button>
        
        <button 
          onClick={() => setActiveTab('3d')}
          className={`px-8 py-3 rounded-2xl font-bold transition-all text-xs uppercase tracking-widest flex items-center gap-2 ${
            activeTab === '3d' 
              ? 'bg-yellow-600 text-gray-950 shadow-lg animate-pulse' 
              : 'bg-white/5 text-white hover:bg-white/10'
          }`}
        >
          🕶️ {t[lang].virtualTour}
        </button>
      </div>

      {/* Gallery Viewport */}
      {activeTab === 'photos' ? (
        <div className="flex flex-col gap-4">
          <div className="relative aspect-[16/9] rounded-[3.5rem] overflow-hidden border border-white/5 bg-white/[0.02] shadow-2xl group">
            <img 
              src={images[mainIndex] || "/hero-bg.png"} 
              alt={propertyTitle} 
              className="w-full h-full object-cover transition-transform duration-[5000ms] group-hover:scale-105" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950/50 to-transparent pointer-events-none" />
            
            {/* Navigasyon Okları */}
            {images.length > 1 && (
              <>
                <button 
                  onClick={() => setMainIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                  className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-gray-950/50 hover:bg-yellow-600 border border-white/10 rounded-full flex items-center justify-center text-white transition-colors z-10"
                >
                  ←
                </button>
                <button 
                  onClick={() => setMainIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                  className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-gray-950/50 hover:bg-yellow-600 border border-white/10 rounded-full flex items-center justify-center text-white transition-colors z-10"
                >
                  →
                </button>
              </>
            )}
          </div>
          
          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar">
              {images.map((img, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setMainIndex(idx)}
                  className={`relative w-32 h-24 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all snap-start ${
                    mainIndex === idx ? 'border-yellow-600 scale-105 shadow-[0_0_15px_rgba(202,138,4,0.4)]' : 'border-white/10 opacity-50 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="relative aspect-[16/9] rounded-[3.5rem] overflow-hidden border border-white/10 bg-black shadow-2xl">
          {externalUrl ? (
            <iframe 
              src={externalUrl} 
              className="w-full h-full border-0" 
              allowFullScreen 
              loading="lazy"
              title="3D Virtual Tour"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-gray-950 text-center">
              <span className="text-5xl mb-6 animate-bounce">🕶️</span>
              <h4 className="text-xl font-serif text-white font-bold mb-2">{t[lang].preparing}</h4>
              <p className="text-gray-500 text-sm max-w-md">
                {t[lang].desc}
              </p>
              <div className="w-16 h-[2px] bg-yellow-600/50 mt-6" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
