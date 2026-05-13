-- İlçe Veritabanı Tablosu (Gelişmiş SEO ve Veri Yapısıyla)
CREATE TABLE IF NOT EXISTS districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE,
  name TEXT,
  avg_sqm_price INTEGER,
  avg_sale_price TEXT,
  avg_rent_price TEXT,
  roi_years NUMERIC,
  trend_percentage NUMERIC,
  yoy_change NUMERIC,
  active_listings INTEGER,
  description TEXT,
  neighborhoods JSONB,
  faqs_sale JSONB,
  faqs_rent JSONB,
  lat TEXT,
  lng TEXT
);

-- RLS Devre Dışı (Hızlı Prototipleme İçin)
ALTER TABLE districts DISABLE ROW LEVEL SECURITY;

-- 8 Stratejik İlçe Verisi (ilce-data.js kaynağından senkronize edildi)
INSERT INTO districts (
  slug, name, avg_sqm_price, avg_sale_price, avg_rent_price, 
  roi_years, trend_percentage, yoy_change, active_listings, 
  description, neighborhoods, faqs_sale, faqs_rent, lat, lng
) VALUES
(
  'cankaya', 'Çankaya', 45000, '7.200.000', '32.000', 18.5, 12.4, 14, 247,
  'Çankaya''da satılık ve kiralık lüks daire arayanlar için Ankara''nın en prestijli ve yatırım değeri yüksek bölgesi. Kaynak Gayrimenkul verilerine göre bölgesel getiri lideri.',
  '["Oran", "Çukurambar", "Ümitköy", "Kızılay", "Bahçelievler", "G.O.Paşa"]',
  '[
    {"q": "Çankaya''da satılık daire fiyatları 2026''da ne kadar?", "a": "2026 yılı itibarıyla Çankaya''da satılık daire m² fiyatı ortalama ₺45.000 civarındadır. 2+1 daireler ₺4.8M–7.5M, 3+1 daireler ₺7.5M–14M aralığında işlem görmektedir."},
    {"q": "Çankaya''nın en değerli mahalleleri hangileri?", "a": "Çukurambar, Oran ve Gaziosmanpaşa en yüksek m² fiyatlarına sahipken; Ümitköy ve Beysukent fiyat/performans dengesi açısından öne çıkmaktadır."},
    {"q": "Çankaya''da daire alırken tapu masrafları ne kadar tutar?", "a": "Tapu devir harcı, gayrimenkulün beyan değerinin %4''üdür (alıcı-satıcı eşit paylaşır). Ayrıca döner sermaye ücreti ve noter masrafları eklenmektedir."}
  ]',
  '[
    {"q": "Çankaya''da kiralık daire fiyatları ne kadar?", "a": "2026 itibarıyla Çankaya''da 2+1 daireler ₺22.000–35.000/ay, 3+1 daireler ₺32.000–55.000/ay aralığında kiralanmaktadır."},
    {"q": "Çankaya''da hangi mahalleler kiracılar için daha uygun?", "a": "Ulaşım ve fiyat dengesi için Dikmen, Birlik ve Aktepe mahalleleri öne çıkmaktadır. Metro erişimi için Kızılay ve Kolej çevresi idealdir."}
  ]',
  '39.9032', '32.8543'
),
(
  'kecioren', 'Keçiören', 27000, '4.200.000', '18.000', 16.0, 14.1, 9, 189,
  'Keçiören bölgesinde satılık daire fırsatları. Hızla gelişen kentsel dönüşüm projeleriyle yüksek kira getirisi sunan ideal yatırım bölgesi.',
  '["Etlik", "Kalaba", "Bağlum", "Şehitler", "Subayevleri"]',
  '[
    {"q": "Keçiören''de satılık daire fiyatları 2026''da ne kadar?", "a": "Keçiören''de satılık daire m² ortalaması ₺27.000''dir. 2+1 daireler ₺2.8M–4.5M, 3+1 daireler ₺4.5M–7M aralığında işlem görmektedir."},
    {"q": "Keçiören''de yatırım amaçlı daire almak mantıklı mı?", "a": "Etlik Şehir Hastanesi''nin yarattığı kira talebi ve bölgedeki altyapı yatırımları Keçiören''i yatırımcılar için cazip kılmaktadır."}
  ]',
  '[
    {"q": "Keçiören''de kiralık daire fiyatları ne kadar?", "a": "2026 itibarıyla 2+1 daireler ₺13.000–20.000/ay, 3+1 daireler ₺18.000–28.000/ay aralığında kiralanmaktadır."}
  ]',
  '39.9892', '32.8513'
),
(
  'etimesgut', 'Etimesgut', 31000, '4.800.000', '21.000', 22.0, 15.8, 11, 163,
  'Etimesgut satılık konut piyasası, yeni metro hatları ve modern yaşam alanlarıyla Ankara''nın en hızlı değer kazanan lokasyonlarından biridir.',
  '["Bağlıca", "Eryaman", "Elvankent", "Yapracık", "Toprak"]',
  '[
    {"q": "Etimesgut''ta satılık daire fiyatları ne kadar?", "a": "2026 itibarıyla Etimesgut''ta m² fiyatı ortalama ₺31.000''dir. 2+1 daireler ₺3.5M–5.5M, 3+1 daireler ₺5.5M–9M aralığındadır."}
  ]',
  '[
    {"q": "Etimesgut''ta kiralık daire fiyatları ne kadar?", "a": "2026 itibarıyla 2+1 ₺15.000–24.000/ay, 3+1 ₺20.000–32.000/ay aralığındadır."}
  ]',
  '39.9497', '32.6791'
),
(
  'sincan', 'Sincan', 22000, '3.100.000', '13.000', 15.5, 18.2, 8, 134,
  'Sincan''da uygun fiyatlı satılık daireler ve yüksek amortisman hızı. Kaynak Gayrimenkul uzmanlığıyla bütçe dostu yatırım fırsatları.',
  '["Fatih", "Gökçek", "İstasyon", "İlkadım", "Yenikent"]',
  '[
    {"q": "Sincan''da satılık daire fiyatları ne kadar?", "a": "2026 itibarıyla Sincan''da m² fiyatı ortalama ₺22.000''dir. 2+1 daireler ₺2.2M–3.8M, 3+1 daireler ₺3.5M–5.5M aralığındadır."}
  ]',
  '[
    {"q": "Sincan''da kiralık daire fiyatları ne kadar?", "a": "2026 itibarıyla 2+1 daireler ₺10.000–16.000/ay, 3+1 daireler ₺15.000–23.000/ay aralığındadır."}
  ]',
  '39.9731', '32.5831'
),
(
  'mamak', 'Mamak', 24000, '3.400.000', '14.500', 17.0, 16.5, 10, 112,
  'Mamak satılık daire piyasasında doğayla iç içe, kentsel dönüşümle yenilenen ve yatırımcısına sürekli kazandıran ayrıcalıklı portföyler.',
  '["Şaşmaz", "Hüseyin Gazi", "Gülveren", "Önder", "Saimekadın"]',
  '[
    {"q": "Mamak''ta satılık daire fiyatları ne kadar?", "a": "2026 itibarıyla Mamak''ta m² fiyatı ortalama ₺24.000''dir. 2+1 daireler ₺2.5M–4M aralığındadır."}
  ]',
  '[
    {"q": "Mamak''ta kiralık daire fiyatları ne kadar?", "a": "2026 itibarıyla 2+1 daireler ₺11.000–17.000/ay aralığındadır."}
  ]',
  '39.9213', '32.9198'
),
(
  'yenimahalle', 'Yenimahalle', 29000, '4.300.000', '19.000', 19.5, 13.5, 10, 178,
  'Yenimahalle kiralık ve satılık konut arayanlar için elit yaşam alanları, güçlü ulaşım ağı ve aile dostu prestijli mahalleler.',
  '["Batıkent", "Demetevler", "Ostim", "Yaşamkent", "Karşıyaka"]',
  '[
    {"q": "Yenimahalle''de satılık daire fiyatları ne kadar?", "a": "2026 itibarıyla m² fiyatı ortalama ₺29.000''dir. 2+1 daireler ₺3.2M–5M, 3+1 daireler ₺5M–8M aralığındadır."}
  ]',
  '[
    {"q": "Yenimahalle''de kiralık daire fiyatları ne kadar?", "a": "2026 itibarıyla 2+1 daireler ₺14.000–22.000/ay aralığındadır."}
  ]',
  '39.9408', '32.7897'
),
(
  'pursaklar', 'Pursaklar', 25000, '3.600.000', '15.000', 16.5, 17.0, 12, 98,
  'Pursaklar satılık ev piyasasında havalimanı güzergahı avantajıyla değerine değer katan, modern mimarili yeni yaşam kompleksleri.',
  '["Saray", "İstasyon", "Merkez", "Dutluk", "Akyurt sınırı"]',
  '[
    {"q": "Pursaklar''da satılık daire fiyatları ne kadar?", "a": "2026 itibarıyla m² fiyatı ortalama ₺25.000''dir. 2+1 daireler ₺2.8M–4.5M aralığındadır."}
  ]',
  '[
    {"q": "Pursaklar''da kiralık daire fiyatları ne kadar?", "a": "2026 itibarıyla 2+1 daireler ₺12.000–18.000/ay aralığındadır."}
  ]',
  '40.0331', '32.8897'
),
(
  'golbasi', 'Gölbaşı', 35000, '5.800.000', '22.000', 20.0, 14.2, 13, 86,
  'Gölbaşı satılık villa ve lüks konut arayanlar için doğa ile iç içe, göl manzaralı ve Ankara''nın en elit müstakil yaşam merkezi.',
  '["İncek", "Hacilar", "Tulumtaş", "Belkız", "Imrahor"]',
  '[
    {"q": "Gölbaşı''nda satılık daire fiyatları ne kadar?", "a": "2026 itibarıyla Gölbaşı''nda daire m² fiyatı ortalama ₺35.000, villa m² fiyatı ₺45.000 civarındadır."}
  ]',
  '[
    {"q": "Gölbaşı''nda kiralık daire fiyatları ne kadar?", "a": "2026 itibarıyla 2+1 daireler ₺18.000–28.000/ay, villa ve müstakil evler ₺40.000–80.000/ay aralığındadır."}
  ]',
  '39.7954', '32.8118'
)
ON CONFLICT (slug) DO UPDATE SET
  avg_sqm_price = EXCLUDED.avg_sqm_price,
  avg_sale_price = EXCLUDED.avg_sale_price,
  avg_rent_price = EXCLUDED.avg_rent_price,
  roi_years = EXCLUDED.roi_years,
  trend_percentage = EXCLUDED.trend_percentage,
  yoy_change = EXCLUDED.yoy_change,
  active_listings = EXCLUDED.active_listings,
  description = EXCLUDED.description,
  neighborhoods = EXCLUDED.neighborhoods,
  faqs_sale = EXCLUDED.faqs_sale,
  faqs_rent = EXCLUDED.faqs_rent,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng;
