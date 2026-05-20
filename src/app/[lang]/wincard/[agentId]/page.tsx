'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Phone, Mail, MapPin, Share2, Download, MessageCircle, ArrowRight, User } from 'lucide-react';

export default function WinCardPage({ params }: { params: { lang: string, agentId: string } }) {
  const [agent, setAgent] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrOpen, setQrOpen] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  useEffect(() => {
    async function fetchAgentAndPortfolios() {
      try {
        // 1. Danışman bilgilerini çekelim (profiles tablosu)
        let name = '';
        let phone = '';
        let email = '';
        let title = 'Lüks Konut Uzmanı';

        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, phone, role')
          .eq('id', params.agentId)
          .maybeSingle();

        if (profile) {
          name = profile.full_name || 'Kaynak Gayrimenkul Danışmanı';
          phone = profile.phone || '';
          title = profile.role === 'admin' ? 'Broker / Kurucu' : 'Lüks Konut Uzmanı';
        } else {
          // Fallback to advisors table
          const { data: advisor } = await supabase
            .from('advisors')
            .select('name, title, phone, email')
            .eq('id', params.agentId)
            .maybeSingle();

          if (advisor) {
            name = advisor.name;
            title = advisor.title || title;
            phone = (advisor as any).phone || '';
            email = (advisor as any).email || '';
          }
        }

        setAgent({
          id: params.agentId,
          name,
          title,
          phone,
          email: email || 'info@kaynakgayrimenkul.com'
        });

        // 2. Danışmanın aktif portföylerini çekelim
        const { data: props } = await supabase
          .from('properties')
          .select('*, districts(name)')
          .eq('agent_id', params.agentId)
          .eq('status', 'aktif')
          .order('created_at', { ascending: false });

        setProperties(props || []);

      } catch (err) {
        console.error('Win Card yükleme hatası:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAgentAndPortfolios();
  }, [params.agentId]);

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${agent?.name} - Kaynak Gayrimenkul`,
          text: `Kaynak Gayrimenkul Dijital Kartviziti`,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Paylaşım iptal edildi.', err);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500 font-bold">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-yellow-600/30 border-t-yellow-600 rounded-full animate-spin"></div>
          <span className="text-sm font-mono tracking-widest uppercase">Win Card Yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400 p-6 text-center">
        <div>
          <h1 className="text-2xl font-bold mb-2">Danışman Profiline Ulaşılamadı</h1>
          <p className="text-sm text-gray-600">ID geçersiz veya profil silinmiş olabilir.</p>
        </div>
      </div>
    );
  }

  const cleanPhone = agent.phone.replace(/\s+/g, '');
  const whatsAppMessage = encodeURIComponent("Merhaba, dijital kartvizitiniz üzerinden ulaşıyorum. Aktif ilanlarınız ve çalışmalarınız hakkında bilgi alabilir miyim?");
  const whatsAppUrl = `https://wa.me/${cleanPhone.startsWith('+') ? cleanPhone.substring(1) : cleanPhone}?text=${whatsAppMessage}`;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center relative overflow-hidden font-sans pb-16">
      
      {/* Background Orbs */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-yellow-600/10 blur-[100px] rounded-full"></div>
      <div className="absolute bottom-[200px] right-[-50px] w-[200px] h-[200px] bg-blue-600/5 blur-[80px] rounded-full"></div>

      {/* Main Glass Card container */}
      <div className="w-full max-w-md px-6 pt-12 z-10 flex flex-col gap-8">
        
        {/* BRAND LOGO */}
        <div className="flex flex-col items-center">
          <span className="text-yellow-500 text-3xl font-extrabold tracking-[0.2em] font-serif uppercase">KAYNAK</span>
          <span className="text-white text-xs tracking-[0.4em] opacity-80 uppercase mt-1">GAYRİMENKUL</span>
        </div>

        {/* PROFILE CARD */}
        <div className="bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl flex flex-col items-center text-center">
          <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-600/5 blur-[40px] rounded-full"></div>
          
          {/* Avatar frame */}
          <div className="w-28 h-28 rounded-full border-2 border-yellow-500/50 p-1 mb-6 flex items-center justify-center bg-gray-900 shadow-inner">
            <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center text-yellow-500 text-3xl font-bold">
              <User size={48} />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1 tracking-wide">{agent.name}</h2>
          <p className="text-xs text-yellow-600 font-bold uppercase tracking-widest mb-8">{agent.title}</p>

          {/* Action Buttons Grid */}
          <div className="grid grid-cols-4 gap-4 w-full mb-8">
            <a 
              href={`tel:${agent.phone}`} 
              className="bg-white/5 border border-white/10 hover:border-yellow-500/30 w-full aspect-square rounded-2xl flex items-center justify-center text-gray-300 hover:text-yellow-500 transition-all group"
              title="Arama Yap"
            >
              <Phone size={20} className="group-hover:scale-110 transition-transform" />
            </a>
            <a 
              href={whatsAppUrl} 
              target="_blank"
              rel="noreferrer"
              className="bg-white/5 border border-white/10 hover:border-yellow-500/30 w-full aspect-square rounded-2xl flex items-center justify-center text-gray-300 hover:text-green-500 transition-all group"
              title="WhatsApp Mesajı"
            >
              <MessageCircle size={20} className="group-hover:scale-110 transition-transform" />
            </a>
            <a 
              href={`mailto:${agent.email}`} 
              className="bg-white/5 border border-white/10 hover:border-yellow-500/30 w-full aspect-square rounded-2xl flex items-center justify-center text-gray-300 hover:text-blue-500 transition-all group"
              title="E-Posta Gönder"
            >
              <Mail size={20} className="group-hover:scale-110 transition-transform" />
            </a>
            <button 
              onClick={() => setQrOpen(true)}
              className="bg-white/5 border border-white/10 hover:border-yellow-500/30 w-full aspect-square rounded-2xl flex items-center justify-center text-gray-300 hover:text-yellow-500 transition-all group"
              title="QR Kod Göster"
            >
              <Share2 size={20} className="group-hover:scale-110 transition-transform" />
            </button>
          </div>

          {/* REHBERE KAYDET PRIMARY BUTTON */}
          <a 
            href={`/api/vcard?agentId=${agent.id}`}
            className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-gray-950 font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-yellow-600/10 active:scale-[0.98]"
          >
            <Download size={18} />
            Rehbere Kaydet
          </a>
        </div>

        {/* AGENCY INFO CARD */}
        <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-6 flex flex-col gap-4 text-xs font-semibold text-gray-400">
          <div className="flex items-center gap-3">
            <MapPin className="text-yellow-500 shrink-0" size={16} />
            <span>Ankara Lüks Konut Uzmanlığı Kokpiti</span>
          </div>
          <div className="flex items-center gap-3">
            <Share2 className="text-yellow-500 shrink-0" size={16} />
            <button onClick={handleShare} className="hover:text-white transition-colors text-left">
              {shareSuccess ? 'Bağlantı Kopyalandı! ✅' : 'Bu Kartviziti Başkasıyla Paylaş'}
            </button>
          </div>
        </div>

        {/* PORTFOLIOS SECTION */}
        <div className="flex flex-col gap-6 mt-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="font-serif text-lg font-bold text-white">Aktif İlanlarım ({properties.length})</h3>
            <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">PORTFÖY</span>
          </div>

          {properties.length === 0 ? (
            <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-8 text-center text-sm text-gray-500 italic">
              Şu an aktif atanmış ilan bulunmamaktadır.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {properties.map((prop) => (
                <div 
                  key={prop.id} 
                  className="bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden hover:border-yellow-500/20 transition-all group flex flex-col shadow-lg"
                >
                  {/* Property Image */}
                  <div className="relative h-48 w-full bg-gray-900 overflow-hidden">
                    {prop.images && prop.images.length > 0 ? (
                      <img 
                        src={prop.images[0]} 
                        alt={prop.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-700 bg-gray-900 font-bold text-xs uppercase tracking-widest">Resim Yok</div>
                    )}
                    <span className="absolute top-4 left-4 bg-yellow-500 text-gray-950 font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-wider">
                      {prop.type || 'Satılık'}
                    </span>
                  </div>

                  {/* Property Details */}
                  <div className="p-6 flex flex-col gap-4">
                    <div>
                      <span className="text-[9px] text-yellow-500 font-bold uppercase tracking-widest block mb-1">
                        Ankara / {prop.districts?.name || 'Lüks Bölge'}
                      </span>
                      <h4 className="text-white font-bold group-hover:text-yellow-500 transition-colors text-sm line-clamp-1">{prop.title}</h4>
                    </div>

                    <div className="flex justify-between items-center border-t border-white/5 pt-4 mt-2">
                      <span className="text-xs text-gray-400 font-semibold">{prop.rooms} | {prop.sqm} m²</span>
                      <span className="text-sm font-bold text-yellow-500 font-mono">
                        {Number(prop.price).toLocaleString('tr-TR')} ₺
                      </span>
                    </div>

                    <Link 
                      href={`/${params.lang}/portfoy`}
                      className="bg-white/5 hover:bg-yellow-500 hover:text-gray-950 border border-white/10 hover:border-yellow-500 py-3 rounded-2xl text-center text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                    >
                      İlanı İncele
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* QR MODAL DIALOG */}
      {qrOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-6" onClick={() => setQrOpen(false)}>
          <div className="bg-gray-900 border border-white/10 p-8 rounded-[2.5rem] w-full max-w-xs flex flex-col items-center gap-6 shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-600/5 blur-[50px] rounded-full"></div>
            
            <div className="text-center">
              <h4 className="font-bold text-white text-lg">Telefonu Uzatın 📱</h4>
              <p className="text-xs text-gray-500 mt-1">Kartviziti okutmak için kamerayı yaklaştırın</p>
            </div>

            {/* QR Image rendering using free secure QR API */}
            <div className="bg-white p-4 rounded-3xl w-full aspect-square flex items-center justify-center shadow-lg border border-yellow-500/20">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.href)}`} 
                alt="Win Card QR Code"
                className="w-full h-full object-contain"
              />
            </div>

            <button 
              onClick={() => setQrOpen(false)}
              className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-2xl text-xs uppercase tracking-wider w-full transition-all"
            >
              Kapat
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
