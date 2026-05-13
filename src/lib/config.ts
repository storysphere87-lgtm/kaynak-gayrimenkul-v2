// Merkezi Yapılandırma Dosyası
// Sitedeki tüm iletişim ve temel marka ayarları tek bir yerden yönetilir.

export const SITE_CONFIG = {
  brand: {
    name: 'Kaynak Gayrimenkul',
    tagline: 'Ankara Yatırım ve Lüks Konut Danışmanlığı',
    founders: ['Cafer Peksoy', 'Refia Nur Peksoy']
  },
  contact: {
    phone: '+905320000000', // Buraya gerçek numara girilecek
    phoneDisplay: '+90 532 000 00 00',
    whatsappMessage: 'Merhaba, yatırımlık lüks portföyleriniz hakkında bilgi almak istiyorum.',
    email: 'fixankara1@gmail.com',
    address: 'Çankaya, Ankara, Türkiye',
    workingHours: 'Pzt-Cmt: 09:00 - 19:00'
  },
  social: {
    instagram: 'https://instagram.com/kaynakgayrimenkul',
    facebook: 'https://facebook.com/kaynakgayrimenkul',
    linkedin: 'https://linkedin.com/company/kaynakgayrimenkul'
  },
  urls: {
    base: 'https://kaynakgayrimenkul.com',
    admin: '/admin'
  }
};
