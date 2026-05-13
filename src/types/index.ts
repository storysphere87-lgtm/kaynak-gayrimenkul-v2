export type Ilan = {
  id: number;
  slug: string;
  baslik: string;
  aciklama: string;
  fiyat: number;
  tip: 'satilik' | 'kiralik';
  ilce: string;
  mahalle: string;
  m2: number;
  oda_sayisi: string;
  bina_yasi: number;
  kat: number | null;
  gorsel_urls: string[];
  video_url: string | null;
  durum: 'aktif' | 'pasif';
  olusturma_tarihi: string;
  danisman_id: number | null;
};

export type Danisman = {
  id: number;
  slug: string;
  ad: string;
  soyad: string;
  telefon: string;
  email: string;
  uzmanlik_ilceleri: string[];
  fotograf_url: string | null;
  bio: string;
};

export type FormLead = {
  id: number;
  tip: 'iletisim' | 'deger' | 'roi' | 'satilik';
  ad: string;
  telefon: string;
  mesaj: string | null;
  ilce: string | null;
  butce: string | null;
  olusturma_tarihi: string;
  okundu: boolean;
};
