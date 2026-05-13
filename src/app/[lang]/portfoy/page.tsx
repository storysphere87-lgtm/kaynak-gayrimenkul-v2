import { getAllProperties, getAllDistricts } from '@/lib/api';
import PortfoyClient from './PortfoyClient';
import { Metadata } from 'next';

import { getDictionary, Locale } from '@/getDictionary';

export async function generateMetadata(props: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang: langParam } = await props.params;
  const lang = langParam as Locale;
  const dict = await getDictionary(lang);
  return {
    title: `${dict.nav.portfolio} | Kaynak Gayrimenkul`,
    description: dict.portfoy.description,
  };
}

export default async function PortfoyPage(props: { params: Promise<{ lang: string }> }) {
  const { lang: langParam } = await props.params;
  const lang = langParam as Locale;
  const properties = await getAllProperties();
  const districts = await getAllDistricts();
  const dict = await getDictionary(lang);

  return <PortfoyClient properties={properties || []} districts={districts || []} dict={dict.portfoy} lang={lang} />;
}
