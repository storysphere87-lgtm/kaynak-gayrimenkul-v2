"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { siteConfig } from '@/config/site';

export default function Nav({ lang, dict }: { lang: string, dict: any }) {
    const pathname = usePathname();
    const router = useRouter();
    const [scrolled, setScrolled] = useState(false);
    const [langMenuOpen, setLangMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Helper to strip the current lang prefix to switch to a new lang
    const getPathWithoutLang = () => {
        if (!pathname) return '/';
        const segments = pathname.split('/');
        // Assuming first segment is always locale like /tr, /en, /ar
        if (segments.length > 1 && ['tr', 'en', 'ar'].includes(segments[1])) {
            return '/' + segments.slice(2).join('/');
        }
        return pathname;
    };

    const handleLangSwitch = (newLang: string) => {
        const newPath = `/${newLang}${getPathWithoutLang()}`;
        router.push(newPath);
        setLangMenuOpen(false);
    };

    const isRtl = lang === 'ar';

    const navLinks = [
        { name: dict.portfolio, href: `/${lang}/portfoy` },
        { name: dict.advisors, href: `/${lang}/danismanlar` },
        { name: dict.sell, href: `/${lang}/evimi-satmak-istiyorum` },
        { name: dict.contact, href: `/${lang}/iletisim` },
    ];

    const currentLangLabel = lang.toUpperCase();

    return (
        <div className={`nav-container ${scrolled ? 'scrolled' : ''}`}>
            <div className={`container nav-content ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Link href={`/${lang}`} className="logo">KAYNAK</Link>
                <div className={`nav-links flex gap-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    {navLinks.map((link) => (
                        <Link 
                            key={link.href} 
                            href={link.href}
                            className={pathname === link.href ? 'active text-yellow-500' : 'hover:text-yellow-500 transition-colors'}
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>
                <div className={`nav-cta flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <Link href={`/${lang}/admin/login`} className="portal-btn">
                        Portal Girişi ✦
                    </Link>
                    <div className="relative">
                        <button 
                            className="bg-gray-800/50 hover:bg-gray-700 border border-gray-700 px-3 py-1.5 rounded-md text-sm font-bold tracking-widest flex items-center gap-2 transition-all"
                            onClick={() => setLangMenuOpen(!langMenuOpen)}
                        >
                            {currentLangLabel}
                            <span className="text-[10px]">▼</span>
                        </button>
                        {langMenuOpen && (
                            <div className="absolute top-full mt-2 right-0 bg-gray-950 border border-yellow-500/20 rounded-lg overflow-hidden shadow-2xl flex flex-col min-w-[100px] z-[9999]">
                                {['tr', 'en', 'ar'].map(l => (
                                    <button 
                                        key={l}
                                        onClick={() => handleLangSwitch(l)}
                                        className={`px-4 py-2 text-sm text-left hover:bg-gray-900 transition-colors ${lang === l ? 'text-yellow-500 font-bold' : 'text-white'}`}
                                    >
                                        {l.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <a href={`tel:${siteConfig.contact.phoneUrl}`} className="btn btn-outline border-yellow-600/50 hover:bg-yellow-600/10 text-white rounded-full transition-all" style={{ padding: '8px 16px', fontSize: '13px' }}>
                        <span style={{ color: 'var(--gold)', marginRight: '8px' }}>📞</span> {siteConfig.contact.phone}
                    </a>
                </div>
            </div>
            <style jsx>{`
                .nav-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    z-index: 50;
                    transition: all 0.3s ease;
                    height: 90px;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }
                .nav-container.scrolled {
                    background: rgba(3, 7, 18, 0.9) !important;
                    backdrop-filter: blur(12px);
                    height: 70px;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                }
                .nav-content {
                    height: 100%;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .logo {
                    font-family: var(--font-cormorant);
                    font-size: 24px;
                    font-weight: 700;
                    letter-spacing: 0.2em;
                    color: white;
                }
                .portal-btn {
                    font-size: 10px;
                    font-weight: 700;
                    letter-spacing: 0.15em;
                    text-transform: uppercase;
                    color: rgba(255, 255, 255, 0.7) !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    padding: 8px 16px;
                    border-radius: 9999px;
                    transition: all 0.3s ease;
                    background: rgba(255, 255, 255, 0.02);
                    text-decoration: none;
                }
                .portal-btn:hover {
                    color: #d4af37 !important;
                    border-color: rgba(212, 175, 55, 0.4) !important;
                    background: rgba(212, 175, 55, 0.05) !important;
                    box-shadow: 0 0 15px rgba(212, 175, 55, 0.05);
                }
            `}</style>
        </div>
    );
}
