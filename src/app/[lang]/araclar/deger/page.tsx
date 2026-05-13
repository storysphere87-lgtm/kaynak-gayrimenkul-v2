import { getAllDistricts } from '@/lib/api';
import DegerlemeClient from './DegerlemeClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ankara Konut Değerleme Hesaplayıcı | Ücretsiz',
  description: 'Ankara Çankaya, Gölbaşı, Etimesgut ve çevresinde gayrimenkulünüzün güncel piyasa değerini otonom algoritmamızla anında öğrenin.',
};

export default async function DegerlemePage() {
  const districts = await getAllDistricts();

  return <DegerlemeClient districts={districts || []} />;
}
