import React from 'react';
import Link from 'next/link';
import { siteConfig } from '@/config/site';

const Footer = ({ lang, dict }: { lang: string, dict: any }) => {
    const isRtl = lang === 'ar';

    return (
        <footer className="bg-gray-950 border-t border-white/5 pt-32 pb-20 relative overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
            {/* Background Ambient Glow */}
            <div className={`absolute top-0 ${isRtl ? 'left-0' : 'right-0'} w-96 h-96 bg-yellow-600/5 blur-[150px] rounded-full pointer-events-none`} />

            <div className="container mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
                    <div className="col-span-1 md:col-span-2">
                        <Link href={`/${lang}`} className="text-3xl font-serif tracking-[0.3em] text-white mb-8 block italic">KAYNAK</Link>
                        <p className="text-gray-500 font-light text-lg max-w-md leading-relaxed mb-12">
                            {dict.about || "Ankara'nın lüks konut piyasasında, veriye dayalı stratejiler ve otonom sistemlerle mülk yönetimi otoritesi."}
                        </p>
                        <div className="flex gap-6">
                            {Object.entries(siteConfig.social).map(([key, url]) => (
                                <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="text-white/20 hover:text-yellow-600 transition-colors uppercase text-[10px] font-bold tracking-widest">
                                    {key}
                                </a>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-white font-sans text-[10px] font-bold uppercase tracking-[0.5em] mb-10">{dict.quickMenu}</h4>
                        <ul className="space-y-6">
                            <li><Link href={`/${lang}/portfoy`} className="text-gray-500 hover:text-white transition-colors text-sm font-light">{dict.allListings}</Link></li>
                            <li><Link href={`/${lang}/evimi-satmak-istiyorum`} className="text-gray-500 hover:text-white transition-colors text-sm font-light">{dict.appraisal}</Link></li>
                            <li><Link href={`/${lang}/araclar/roi`} className="text-gray-500 hover:text-white transition-colors text-sm font-light">{dict.roi}</Link></li>
                            <li><Link href={`/${lang}/hakkimizda`} className="text-gray-500 hover:text-white transition-colors text-sm font-light">{dict.whoWeAre}</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-sans text-[10px] font-bold uppercase tracking-[0.5em] mb-10">{dict.contact}</h4>
                        <ul className="space-y-6">
                            <li className="flex items-start gap-4">
                                <span className="text-yellow-600/50 text-sm">📍</span>
                                <span className="text-gray-500 text-sm font-light leading-relaxed">{siteConfig.contact.address}</span>
                            </li>
                            <li className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <span className="text-yellow-600/50 text-sm">📞</span>
                                <a href={`tel:${siteConfig.contact.phoneUrl}`} className="text-gray-500 hover:text-white transition-colors text-sm font-light">{siteConfig.contact.phone}</a>
                            </li>
                            <li className="flex items-center gap-4">
                                <span className="text-yellow-600/50 text-sm">✉️</span>
                                <a href={`mailto:${siteConfig.contact.email}`} className="text-gray-500 hover:text-white transition-colors text-sm font-light">{siteConfig.contact.email}</a>
                            </li>
                            <li className="flex items-center gap-4">
                                <span className="text-yellow-600/50 text-sm">🕒</span>
                                <span className="text-gray-500 text-sm font-light">{siteConfig.contact.workingHours}</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="pt-12 border-t border-white/5 flex flex-col lg:flex-row justify-between items-center gap-8 w-full">
                    {/* Copyright Section */}
                    <div className="text-center lg:text-left">
                        <p className="text-white/25 text-[10px] font-medium tracking-widest uppercase">
                            &copy; {new Date().getFullYear()} {siteConfig.name}. {dict.rights}
                        </p>
                    </div>

                    {/* Nextoria Shimmer Signature with isolated block wrapper */}
                    <div className="my-4 lg:my-0">
                        <a 
                            href="https://nextoriadigital.com" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="group flex items-center justify-center gap-3 px-6 py-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-yellow-600/20 hover:bg-white/[0.04] transition-all duration-500 shadow-xl"
                        >
                            <span className="text-white/30 text-[8px] font-bold uppercase tracking-[0.4em] transition-colors group-hover:text-white/60">Designed by</span>
                            <span className="animate-nextoria-text text-[13px] font-black tracking-[0.5em] uppercase drop-shadow-[0_0_12px_rgba(251,191,36,0.4)]">Nextoria</span>
                        </a>
                    </div>

                    {/* Footer Legal Links */}
                    <div className="flex gap-8">
                        <Link href={`/${lang}/kvkk`} className="text-white/25 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest">{dict.privacy}</Link>
                        <Link href={`/${lang}/cerez-politikasi`} className="text-white/25 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest">{dict.cookies}</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
