import { getDictionary, Locale } from '@/getDictionary';
import { getAllDistricts } from '@/lib/api';
import ROICalculatorClient from './ROICalculatorClient';
import { Metadata } from 'next';

export async function generateMetadata(props: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang: langParam } = await props.params;
  const lang = langParam as Locale;
  const dict = await getDictionary(lang);
  return {
    title: `Gayrimenkul ROI Hesaplama | Kaynak Gayrimenkul`,
    description: `Ankara konut yatırımı amortisman süresi ve getiri analizi aracı.`,
  };
}

export default async function ROIPage(props: { params: Promise<{ lang: string }> }) {
  const { lang: langParam } = await props.params;
  const lang = langParam as Locale;
  const dict = await getDictionary(lang);
  const districts = await getAllDistricts();

  return <ROICalculatorClient lang={lang} dict={dict} districts={districts} />;
}
