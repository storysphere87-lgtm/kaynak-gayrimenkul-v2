export interface District {
  id: string;
  slug: string;
  name: string;
  avg_sqm_price: number;
  roi_years: number;
  trend_percentage: number;
  description: string;
}

export interface Property {
  id: string;
  district_id: string;
  title: string;
  type: 'satilik' | 'kiralik';
  category: 'daire' | 'villa' | 'arsa' | 'ticari';
  price: number;
  rooms: string;
  sqm: number;
  status: 'aktif' | 'pasif';
  created_at: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  form_type: 'degerleme' | 'iletisim' | 'ilan_bilgi';
  target_district?: string;
  expected_budget?: number;
  created_at: string;
}
