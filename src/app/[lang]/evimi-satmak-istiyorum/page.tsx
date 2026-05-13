import { Metadata } from 'next';
import SellerFunnelClient from './SellerFunnelClient';
import { getDictionary, Locale } from '@/getDictionary';
import { getAllDistricts } from '@/lib/api';

export async function generateMetadata({ params }: { params: Promise<{ lang: Locale }> }): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  return {
    title: `${dict.nav.sell} | Kaynak Gayrimenkul`,
    description: dict.sellerFunnel.step4.description,
  };
}

export default async function SellerFunnelPage({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const districts = await getAllDistricts();
  
  return <SellerFunnelClient dict={dict.sellerFunnel} lang={lang} districts={districts} />;
}
