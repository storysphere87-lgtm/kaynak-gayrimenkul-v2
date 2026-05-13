import { getAllProperties, getAllDistricts } from '@/lib/api';
import PortfoyClient from './PortfoyClient';
import { Metadata } from 'next';

import { getDictionary, Locale } from '@/getDictionary';

export async function generateMetadata({ params: { lang } }: { params: { lang: Locale } }): Promise<Metadata> {
  const dict = await getDictionary(lang);
  return {
    title: `${dict.nav.portfolio} | Kaynak Gayrimenkul`,
    description: dict.portfoy.description,
  };
}

export default async function PortfoyPage({ params: { lang } }: { params: { lang: Locale } }) {
  const properties = await getAllProperties();
  const districts = await getAllDistricts();
  const dict = await getDictionary(lang);

  return <PortfoyClient properties={properties || []} districts={districts || []} dict={dict.portfoy} lang={lang} />;
}
