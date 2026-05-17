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
          📸 Fotoğraflar ({images.length})
        </button>
        
        <button 
          onClick={() => setActiveTab('3d')}
          className={`px-8 py-3 rounded-2xl font-bold transition-all text-xs uppercase tracking-widest flex items-center gap-2 ${
            activeTab === '3d' 
              ? 'bg-yellow-600 text-gray-950 shadow-lg animate-pulse' 
              : 'bg-white/5 text-white hover:bg-white/10'
          }`}
        >
          🕶️ 3D Sanal Tur
        </button>
      </div>

      {/* Gallery Viewport */}
      {activeTab === 'photos' ? (
        <div className="relative aspect-[16/9] rounded-[3.5rem] overflow-hidden border border-white/5 bg-white/[0.02] shadow-2xl group">
          <img 
            src={images[0] || "/hero-bg.png"} 
            alt={propertyTitle} 
            className="w-full h-full object-cover transition-transform duration-[5000ms] group-hover:scale-105" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950/50 to-transparent pointer-events-none" />
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
              <h4 className="text-xl font-serif text-white font-bold mb-2">3D Sanal Tur Hazırlanıyor</h4>
              <p className="text-gray-500 text-sm max-w-md">
                Bu lüks portföy için Matterport 3D tarama ve sanal modelleme süreci devam etmektedir. En kısa sürede yayına alınacaktır.
              </p>
              <div className="w-16 h-[2px] bg-yellow-600/50 mt-6" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
