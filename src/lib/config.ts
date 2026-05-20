import { siteConfig } from '../config/site';

export const SITE_CONFIG = {
  brand: {
    name: siteConfig.name,
    tagline: siteConfig.tagline,
    founders: siteConfig.founders
  },
  contact: {
    phone: siteConfig.contact.phoneUrl,
    phoneDisplay: siteConfig.contact.phone,
    whatsappMessage: 'Merhaba, yatırımlık lüks portföyleriniz hakkında bilgi almak istiyorum.',
    email: siteConfig.contact.email,
    address: siteConfig.contact.address,
    workingHours: siteConfig.contact.workingHours
  },
  social: siteConfig.social,
  urls: {
    base: siteConfig.url,
    admin: '/admin'
  }
};

