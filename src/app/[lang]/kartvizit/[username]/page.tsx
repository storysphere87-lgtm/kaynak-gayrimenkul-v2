import React from 'react';
import Link from 'next/link';
import { Phone, Mail, MessageSquare, UserPlus, Compass, ArrowRight, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { siteConfig } from '@/config/site';

/**
 * Quantum OS - Dijital NFC/QR Kartvizit Profili (Faz 4)
 * WinVapp'in 1000 TL/ay sattığı dijital kartvizit özelliğini $0 maliyetle,
 * çok daha lüks ve elite "Quiet Luxury" tasarım standartlarında sisteme dahil eder.
 */
export default async function DigitalBusinessCardPage({
  params
}: {
  params: Promise<{ lang: string; username: string }>;
}) {
  const { lang, username } = await params;

  // Danışman profili veritabanından çekilir (Büyük/küçük harf duyarsız arama)
  const isCafer = username.toLowerCase().includes('cafer');
  const isRefia = username.toLowerCase().includes('refia');

  let profile = {
    full_name: isRefia ? 'Refia Nur Peksoy' : 'Cafer Peksoy',
    phone: isRefia ? '0530 000 00 00' : '0545 193 20 06',
    email: isRefia ? 'refia@kaynakgayrimenkul.com' : 'info@kaynakgayrimenkul.com',
    role: isRefia ? 'Lüks Konut Yatırım Danışmanı' : 'Kurucu & Lüks Konut Brokerı',
    image: isRefia 
      ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400' 
      : 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400'
  };

  try {
    const { data: dbProfile } = await supabase
      .from('profiles')
      .select('*')
      .ilike('full_name', `%${username}%`)
      .maybeSingle();

    if (dbProfile) {
      profile.full_name = dbProfile.full_name;
      profile.phone = dbProfile.phone || profile.phone;
      profile.email = dbProfile.email || profile.email;
      profile.role = dbProfile.role === 'admin' ? 'Kurucu & Lüks Konut Brokerı' : 'Lüks Konut Yatırım Danışmanı';
    }
  } catch (err) {
    console.error("Profile fetch error:", err);
  }

  const rawPhone = profile.phone.replace(/[^0-9]/g, '');
  const finalPhone = rawPhone.length === 10 ? `90${rawPhone}` : rawPhone;
  const waGreeting = `Merhaba ${profile.full_name}, Kaynak Gayrimenkul web sitenizdeki dijital kartvizitiniz üzerinden sizinle iletişime geçiyorum.`;
  
  const vcardUrl = `/api/vcard?name=${encodeURIComponent(profile.full_name)}&phone=${encodeURIComponent(profile.phone)}&email=${encodeURIComponent(profile.email)}&role=${encodeURIComponent(profile.role)}`;
  const businessCardUrl = `https://kaynakgayrimenkul.com/${lang}/kartvizit/${username}`;
  const qrCodeUrl = `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(businessCardUrl)}&choe=UTF-8`;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col justify-between pt-28 pb-12 px-4 relative overflow-hidden font-sans">
      
      {/* Arka Plan Asil Lüks Aydınlatmalar */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-yellow-600/5 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-10 left-10 w-64 h-64 bg-blue-600/5 blur-[100px] rounded-full"></div>

      <div className="max-w-md w-full mx-auto flex-1 flex flex-col justify-center">
        
        {/* LÜKS CÜZDAN KARTI GÖRÜNÜMÜ */}
        <div className="relative bg-gradient-to-b from-gray-900 to-gray-950 border border-yellow-600/30 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-md overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-yellow-600/10 to-transparent blur-2xl rounded-full"></div>
          
          {/* Logo */}
          <div className="flex justify-between items-center mb-8">
            <span className="text-[10px] font-bold text-yellow-500/70 tracking-[6px] uppercase">KAYNAK GAYRİMENKUL</span>
            <span className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[8px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              VIP MEMBER
            </span>
          </div>

          {/* Profil Detayları */}
          <div className="flex items-center gap-5 mb-8">
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-yellow-500/40 p-0.5 shadow-lg bg-gray-950">
              <img 
                src={profile.image} 
                alt={profile.full_name} 
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white mb-1">{profile.full_name}</h1>
              <p className="text-xs font-semibold text-yellow-500/80 tracking-wide">{profile.role}</p>
              <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">Ankara Lüks Konut Portföyü</p>
            </div>
          </div>

          <hr className="border-white/5 mb-8" />

          {/* HIZLI EYLEM BUTONLARI (INTERACTIVE) */}
          <div className="grid grid-cols-1 gap-3">
            
            {/* REHBERE EKLE (VCARD) */}
            <a 
              href={vcardUrl}
              className="flex items-center justify-between w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-gray-950 font-bold py-4 px-6 rounded-2xl shadow-lg transition-all active:scale-[0.98]"
            >
              <span className="flex items-center gap-3">
                <UserPlus size={18} />
                Rehbere Kaydet (VCard)
              </span>
              <ArrowRight size={16} />
            </a>

            {/* WHATSAPP SOHBET */}
            <a 
              href={`https://wa.me/${finalPhone}?text=${encodeURIComponent(waGreeting)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full bg-gray-900/60 border border-white/10 hover:border-yellow-600/30 hover:bg-gray-900 text-white font-semibold py-4 px-6 rounded-2xl transition-all active:scale-[0.98]"
            >
              <span className="flex items-center gap-3 text-sm">
                <MessageSquare size={18} className="text-green-500" />
                WhatsApp Sohbeti Başlat
              </span>
              <ExternalLink size={14} className="text-gray-500" />
            </a>

            {/* TELEFON ARAMA */}
            <a 
              href={`tel:${profile.phone.replace(/\s+/g, '')}`}
              className="flex items-center justify-between w-full bg-gray-900/60 border border-white/10 hover:border-yellow-600/30 hover:bg-gray-900 text-white font-semibold py-4 px-6 rounded-2xl transition-all active:scale-[0.98]"
            >
              <span className="flex items-center gap-3 text-sm">
                <Phone size={18} className="text-blue-400" />
                Doğrudan Telefonla Ara
              </span>
              <ArrowRight size={14} className="text-gray-500" />
            </a>

            {/* E-POSTA GÖNDER */}
            <a 
              href={`mailto:${profile.email}`}
              className="flex items-center justify-between w-full bg-gray-900/60 border border-white/10 hover:border-yellow-600/30 hover:bg-gray-900 text-white font-semibold py-4 px-6 rounded-2xl transition-all active:scale-[0.98]"
            >
              <span className="flex items-center gap-3 text-sm">
                <Mail size={18} className="text-yellow-500" />
                E-Posta Gönder
              </span>
              <ArrowRight size={14} className="text-gray-500" />
            </a>

            {/* WEB SİTESİNE GİT */}
            <Link 
              href={`/${lang}`}
              className="flex items-center justify-between w-full bg-gray-900/60 border border-white/10 hover:border-yellow-600/30 hover:bg-gray-900 text-white font-semibold py-4 px-6 rounded-2xl transition-all active:scale-[0.98]"
            >
              <span className="flex items-center gap-3 text-sm">
                <Compass size={18} className="text-yellow-500/80 animate-spin-slow" />
                Web Sitesi & Portföyüm
              </span>
              <ArrowRight size={14} className="text-gray-500" />
            </Link>

          </div>
        </div>

        {/* DİNAMİK QR KOD ALANI (NFC & SOSYAL PAYLAŞIM İÇİN) */}
        <div className="mt-8 flex flex-col items-center justify-center bg-gray-900/20 border border-white/5 rounded-3xl p-6 backdrop-blur-md max-w-[280px] mx-auto text-center">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Hızlı Paylaşım QR Kodu</p>
          <div className="bg-white p-3 rounded-2xl shadow-xl inline-block">
            <img src={qrCodeUrl} alt="Business Card QR Code" className="w-36 h-36" />
          </div>
          <p className="text-[9px] text-gray-400 mt-3 leading-relaxed">
            Telefon kamerasını tutarak bu dijital kartvizite anında erişebilirsiniz.
          </p>
        </div>

      </div>

      {/* Telif Hakları ve Marka Alt Bilgisi */}
      <div className="text-center mt-8">
        <p className="text-[10px] text-gray-600 tracking-wider">
          © {new Date().getFullYear()} Kaynak Gayrimenkul Quantum OS. Tüm Hakları Saklıdır.
        </p>
      </div>

    </div>
  );
}
