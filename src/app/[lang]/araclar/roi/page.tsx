import { getDictionary, Locale } from '@/getDictionary';
import { getAllDistricts } from '@/lib/api';
import ROICalculatorClient from './ROICalculatorClient';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ lang: Locale }> }): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  return {
    title: `Gayrimenkul ROI Hesaplama | Kaynak Gayrimenkul`,
    description: `Ankara konut yatırımı amortisman süresi ve getiri analizi aracı.`,
  };
}

export default async function ROIPage({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const districts = await getAllDistricts();

  return <ROICalculatorClient lang={lang} dict={dict} districts={districts} />;
}
