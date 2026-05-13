'use client';

import React, { useState } from 'react';

export default function AdminPage() {
  const [formData, setFormData] = useState({ title: '', price: '', district: '' });
  const [storyPreview, setStoryPreview] = useState('');

  const handleGenerateStory = () => {
    const url = `/api/social-story?title=${encodeURIComponent(formData.title)}&price=${encodeURIComponent(formData.price)}`;
    setStoryPreview(url);
  };

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-8 pt-32 font-sans relative z-10">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <h1 className="text-4xl font-serif text-white">Otonom <span className="text-yellow-500 italic">Merkez Üs</span></h1>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/api/feed/xml`);
              alert('XML Feed Linki Kopyalandı!');
            }}
            className="bg-white/5 border border-white/10 px-6 py-3 rounded-xl hover:border-yellow-600 transition-all text-xs font-bold tracking-widest uppercase text-white"
          >
            📋 XML Feed Linkini Kopyala
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* SOL: İLAN GİRİŞ FORMU */}
          <div className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] backdrop-blur-xl">
            <h2 className="text-2xl font-serif mb-8 italic text-white">Hızlı İlan Girişi</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold ml-2">İlan Başlığı</label>
                <input 
                  placeholder="Örn: Çankaya'da Satılık 4+1" 
                  className="w-full bg-gray-900 border border-white/5 p-4 rounded-2xl text-xl outline-none focus:border-yellow-600 transition-colors text-white"
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold ml-2">Fiyat</label>
                <input 
                  placeholder="Örn: 12.500.000 ₺" 
                  className="w-full bg-gray-900 border border-white/5 p-4 rounded-2xl text-xl outline-none focus:border-yellow-600 transition-colors text-white"
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold ml-2">İlçe</label>
                <select 
                  className="w-full bg-gray-900 border border-white/5 p-4 rounded-2xl text-xl outline-none focus:border-yellow-600 transition-colors text-white appearance-none"
                  onChange={(e) => setFormData({...formData, district: e.target.value})}
                >
                  <option value="">İlçe Seçiniz</option>
                  <option value="cankaya">Çankaya</option>
                  <option value="golbasi">Gölbaşı</option>
                </select>
              </div>
              <button 
                onClick={handleGenerateStory}
                className="w-full bg-yellow-600 hover:bg-yellow-500 text-gray-950 p-6 rounded-2xl font-bold text-lg mt-8 transition-all shadow-xl hover:-translate-y-1"
              >
                ✨ Otonom Görsel Üret
              </button>
            </div>
          </div>

          {/* SAĞ: ÖNİZLEME PANOSU */}
          <div className="flex flex-col items-center">
            <h3 className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-6 font-bold">Story Önizleme (9:16)</h3>
            <div className="relative w-[300px] aspect-[9/16] bg-gray-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl group">
              {storyPreview ? (
                <img src={storyPreview} alt="Story Preview" className="w-full h-full object-cover animate-in zoom-in duration-500" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-700 italic text-sm text-center p-8">
                  <div className="text-4xl mb-4 opacity-20">🎨</div>
                  Formu doldurduktan sonra görseli burada göreceksiniz.
                </div>
              )}
              {storyPreview && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                   <a 
                    href={storyPreview} 
                    download="kaynak-gayrimenkul-story.png"
                    className="bg-white text-gray-950 px-6 py-2 rounded-full font-bold text-xs"
                  >
                    Görseli İndir
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
