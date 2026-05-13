import type { Metadata } from 'next';
import Script from 'next/script';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';
import '../globals.css';
import Nav from '@/components/layout/Nav';
import Footer from '@/components/layout/Footer';
import ExitIntentPopup from '@/components/ExitIntentPopup';
import FloatingContact from '@/components/FloatingContact';
import { getDictionary, Locale } from '@/getDictionary';
import { siteConfig } from '@/config/site';

const cormorant = Cormorant_Garamond({ 
  subsets: ['latin'], 
  weight: ['400', '600', '700'],
  variable: '--font-cormorant' 
});

const dmSans = DM_Sans({ 
  subsets: ['latin'], 
  weight: ['400', '500', '700'],
  variable: '--font-dmsans' 
});

export async function generateMetadata({ params }: { params: Promise<{ lang: Locale }> }): Promise<Metadata> {
  // We can fetch dictionary here to set localized title/description if needed
  const { lang } = await params;
  const dict = await getDictionary(lang);
  
  return {
    title: {
      default: `${dict.home.badge} | Kaynak Gayrimenkul`,
      template: '%s | Kaynak Gayrimenkul'
    },
    description: dict.home.title,
    alternates: {
      canonical: 'https://kaynakgayrimenkul.com',
      languages: {
        'tr-TR': 'https://kaynakgayrimenkul.com/tr',
        'en-US': 'https://kaynakgayrimenkul.com/en',
        'ar-SA': 'https://kaynakgayrimenkul.com/ar',
      },
    },
    other: {
      'geo.region': 'TR-06',
      'geo.placename': 'Ankara',
      'geo.position': '39.9334;32.8597',
      'ICBM': '39.9334, 32.8597'
    }
  };
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const isRtl = lang === 'ar';
  const dict = await getDictionary(lang);
  
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "name": siteConfig.name,
    "image": `${siteConfig.url}/logo.png`,
    "@id": siteConfig.url,
    "url": siteConfig.url,
    "telephone": siteConfig.contact.phoneUrl,
    "priceRange": "$$$",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Ahi Mesut Mah. 1905. Sokak No:2/C-A",
      "addressLocality": "Etimesgut",
      "addressRegion": "Ankara",
      "postalCode": "06790",
      "addressCountry": "TR"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 39.9548,
      "longitude": 32.6418
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
      ],
      "opens": "09:00",
      "closes": "19:00"
    },
    "sameAs": [
      siteConfig.social.instagram,
      siteConfig.social.facebook,
      siteConfig.social.linkedin
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": siteConfig.contact.phoneUrl,
      "contactType": "sales",
      "url": siteConfig.seo.valuationUrl
    }
  };

  return (
    <html lang={lang} dir={isRtl ? 'rtl' : 'ltr'} className="scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${cormorant.variable} ${dmSans.variable} font-sans bg-gray-950 text-gray-100 antialiased ${isRtl ? 'rtl' : ''}`}>
        {/* Google Analytics 4 */}
        <Script src={`https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX`} strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XXXXXXXXXX');
          `}
        </Script>

        <Nav lang={lang} dict={dict.nav} />
        <div className="relative min-h-screen">
          {children}
        </div>
        <Footer lang={lang} dict={dict.nav} />
        <ExitIntentPopup lang={lang} />
        <FloatingContact lang={lang} />
      </body>
    </html>
  );
}
