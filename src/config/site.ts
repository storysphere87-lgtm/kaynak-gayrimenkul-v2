/**
 * Quantum OS - Merkezi Site Konfigürasyonu
 * Sitedeki tüm iletişim ve temel marka ayarları tek bir yerden yönetilir.
 */
export const siteConfig = {
  name: "Kaynak Gayrimenkul",
  tagline: "Ankara Yatırım ve Lüks Konut Danışmanlığı",
  url: "https://kaynakgayrimenkul.com",
  founders: ["Cafer Peksoy", "Refia Nur Peksoy"],
  contact: {
    phone: "0545 193 20 06", 
    phoneUrl: "+905451932006",
    email: "info@kaynakgayrimenkul.com",
    address: "Ahi Mesut Mah. 1905. Sokak No:2/C-A Etimesgut, Ankara",
    workingHours: "Pzt-Cmt: 09:00 - 19:00"
  },
  social: {
    instagram: "https://instagram.com/kaynakgayrimenkul",
    facebook: "https://facebook.com/kaynakgayrimenkul",
    linkedin: "https://linkedin.com/company/kaynakgayrimenkul",
    whatsapp: "https://wa.me/905451932006?text=Merhaba,%20Etimesgut%20bölgesindeki%20mülküm%20için%20değerleme/danışmanlık%20almak%20istiyorum.",
  },
  seo: {
    defaultTitle: "Kaynak Gayrimenkul | Ankara Lüks Konut Portalı",
    defaultDescription: "Ankara'nın en prestijli bölgelerinde, lüks konut ve yatırım fırsatları.",
    valuationUrl: "https://kaynakgayrimenkul.com/tr/evimi-satmak-istiyorum"
  }
};

export type SiteConfig = typeof siteConfig;
