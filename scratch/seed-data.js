const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const districts = [
  { slug: 'cankaya', name: 'Çankaya', avg_sqm_price: 45000, roi_years: 18.5, trend_percentage: 12.4, description: "Çankaya'da satılık ve kiralık lüks daire arayanlar için Ankara'nın en prestijli ve yatırım değeri yüksek bölgesi.", lat: '39.9032', lng: '32.8543' },
  { slug: 'kecioren', name: 'Keçiören', avg_sqm_price: 27000, roi_years: 16.0, trend_percentage: 14.1, description: "Keçiören bölgesinde satılık daire fırsatları. Hızla gelişen kentsel dönüşüm projeleriyle yüksek kira getirisi sunan ideal yatırım bölgesi.", lat: '39.9892', lng: '32.8513' },
  { slug: 'etimesgut', name: 'Etimesgut', avg_sqm_price: 31000, roi_years: 22.0, trend_percentage: 15.8, description: "Etimesgut satılık konut piyasası, yeni metro hatları ve modern yaşam alanlarıyla Ankara'nın en hızlı değer kazanan lokasyonlarından biridir.", lat: '39.9497', lng: '32.6791' },
  { slug: 'sincan', name: 'Sincan', avg_sqm_price: 22000, roi_years: 15.5, trend_percentage: 18.2, description: "Sincan'da uygun fiyatlı satılık daireler ve yüksek amortisman hızı.", lat: '39.9731', lng: '32.5831' },
  { slug: 'mamak', name: 'Mamak', avg_sqm_price: 24000, roi_years: 17.0, trend_percentage: 16.5, description: "Mamak satılık daire piyasasında doğayla iç içe, kentsel dönüşümle yenilenen ve yatırımcısına sürekli kazandıran ayrıcalıklı portföyler.", lat: '39.9213', lng: '32.9198' },
  { slug: 'yenimahalle', name: 'Yenimahalle', avg_sqm_price: 29000, roi_years: 19.5, trend_percentage: 13.5, description: "Yenimahalle kiralık ve satılık konut arayanlar için elit yaşam alanları, güçlü ulaşım ağı ve aile dostu prestijli mahalleler.", lat: '39.9408', lng: '32.7897' },
  { slug: 'pursaklar', name: 'Pursaklar', avg_sqm_price: 25000, roi_years: 16.5, trend_percentage: 17.0, description: "Pursaklar satılık ev piyasasında havalimanı güzergahı avantajıyla değerine değer katan, modern mimarili yeni yaşam kompleksleri.", lat: '40.0331', lng: '32.8897' },
  { slug: 'golbasi', name: 'Gölbaşı', avg_sqm_price: 35000, roi_years: 20.0, trend_percentage: 14.2, description: "Gölbaşı satılık villa ve lüks konut arayanlar için doğa ile iç içe, göl manzaralı ve Ankara'nın en elit müstakil yaşam merkezi.", lat: '39.7954', lng: '32.8118' }
];

const propertiesTemplate = [
  {
    title: 'Çankaya Vadi Manzaralı Lüks Rezidans',
    price: 12500000,
    district_slug: 'cankaya',
    type: 'Satılık',
    rooms: '4+1',
    sqm: 185,
    status: 'aktif',
    category: 'Daire',
    description: 'Ankara\'nın en prestijli bölgesinde, tam donanımlı akıllı ev sistemi ve vadi manzarasına sahip ultra lüks daire.',
    images: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1200"]
  },
  {
    title: 'İncek Modern Havuzlu Villa',
    price: 28000000,
    district_slug: 'golbasi',
    type: 'Satılık',
    rooms: '6+2',
    sqm: 450,
    status: 'aktif',
    category: 'Villa',
    description: 'Doğa ile iç içe, müstakil havuzlu, yerden ısıtmalı ve akıllı ev teknolojisiyle donatılmış modern villa.',
    images: ["https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=1200"]
  },
  {
    title: 'Eryaman Metro Yakını Aile Konutu',
    price: 4800000,
    district_slug: 'etimesgut',
    type: 'Satılık',
    rooms: '3+1',
    sqm: 145,
    status: 'aktif',
    category: 'Daire',
    description: 'Metro durağına yürüme mesafesinde, geniş peyzaj alanına sahip site içerisinde bakımlı aile konutu.',
    images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=1200"]
  },
  {
    title: 'Ümitköy Merkezi Kiralık Lüks Daire',
    price: 45000,
    district_slug: 'cankaya',
    type: 'Kiralık',
    rooms: '3+1',
    sqm: 160,
    status: 'aktif',
    category: 'Daire',
    description: 'Ümitköy\'ün kalbinde, tüm ulaşım akslarına yakın, yeni tadilatlı ve full yapılı kiralık daire.',
    images: ["https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&q=80&w=1200"]
  }
];

async function seed() {
  console.log("🌱 Filtrelenmiş veri ile veritabanı tohumlanıyor...");

  try {
    // 1. İlçeleri tohumla (Sadece mevcut kolonlarla)
    const districtMap = {};
    for (const d of districts) {
      const { data, error } = await supabase
        .from('districts')
        .upsert(d, { onConflict: 'slug' })
        .select();
      if (error) {
        console.error(`❌ İlçe hatası (${d.slug}):`, error.message);
      } else {
        console.log(`✅ İlçe tohumlandı: ${d.name}`);
        districtMap[d.slug] = data[0].id;
      }
    }

    // Eğer upsert select boş dönerse diye veritabanından güncel eşleşmeleri çekelim
    const { data: dbDistricts } = await supabase.from('districts').select('id, slug');
    dbDistricts.forEach(d => {
      districtMap[d.slug] = d.id;
    });

    console.log("District UUID Haritası:", districtMap);

    // 2. İlanları temizle ve tohumla (district_id olarak UUID kullanarak)
    await supabase.from('properties').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    for (const p of propertiesTemplate) {
      const uuid = districtMap[p.district_slug];
      if (!uuid) {
        console.error(`❌ HATA: '${p.district_slug}' slug'ına ait ilçe UUID'si bulunamadı.`);
        continue;
      }

      // properties formatına uyarla
      const { district_slug, ...pData } = p;
      pData.district_id = uuid; // district_id artık UUID

      const { data, error } = await supabase
        .from('properties')
        .insert(pData);
      if (error) {
        console.error(`❌ İlan hatası (${p.title}):`, error.message);
      } else {
        console.log(`✅ İlan tohumlandı: ${p.title}`);
      }
    }

    console.log("🎉 Filtrelenmiş tohumlama işlemi başarıyla tamamlandı!");
  } catch (e) {
    console.error("❌ Tohumlama sırasında genel hata:", e.message);
  }
}

seed();
