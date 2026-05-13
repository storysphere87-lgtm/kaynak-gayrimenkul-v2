import { Metadata } from 'next';
import SellerFunnelClient from './SellerFunnelClient';
import { getDictionary, Locale } from '@/getDictionary';
import { getAllDistricts } from '@/lib/api';

export async function generateMetadata(props: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang: langParam } = await props.params;
  const lang = langParam as Locale;
  const dict = await getDictionary(lang);
  return {
    title: `${dict.nav.sell} | Kaynak Gayrimenkul`,
    description: dict.sellerFunnel.step4.description,
  };
}

export default async function SellerFunnelPage(props: { params: Promise<{ lang: string }> }) {
  const { lang: langParam } = await props.params;
  const lang = langParam as Locale;
  const dict = await getDictionary(lang);
  const districts = await getAllDistricts();
  
  return <SellerFunnelClient dict={dict.sellerFunnel} lang={lang} districts={districts} />;
}
