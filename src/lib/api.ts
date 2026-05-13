import { supabase } from './supabase';

export async function getDistrictData(slug: string) {
  const { data, error } = await supabase
    .from('districts')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Bölge verisi çekilemedi:', error);
    return null;
  }
  return data;
}

export async function getPropertiesByDistrict(districtId: string, type: string) {
  const { data, error } = await supabase
    .from('properties')
    .select('*, districts(name, slug)')
    .eq('district_id', districtId)
    .eq('status', 'aktif');

  if (error) {
    console.error('İlanlar çekilemedi:', error);
    return [];
  }
  return data;
}

export async function getPropertyById(id: string) {
  const { data, error } = await supabase
    .from('properties')
    .select('*, districts(name, slug)')
    .eq('id', id)
    .single();

  if (error) {
    console.error('İlan detayı çekilemedi:', error);
    return null;
  }
  return data;
}

export async function getAllProperties() {
  const { data, error } = await supabase
    .from('properties')
    .select('*, districts(name)')
    .eq('status', 'aktif')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Tüm ilanlar çekilemedi:', error);
    return [];
  }
  return data;
}

export async function getDistrictsWithCounts() {
  const { data, error } = await supabase
    .from('districts')
    .select('*, properties!left(id)')
    .eq('properties.status', 'aktif')
    .order('name');

  if (error) {
    console.error('İlçe sayıları çekilemedi:', error);
    return [];
  }

  // Supabase join returns an array of properties for each district. 
  // We map it to include a count property.
  return data.map((dist: any) => ({
    ...dist,
    activeCount: dist.properties ? dist.properties.length : 0
  }));
}

export async function getAdvisors() {
  const { data, error } = await supabase
    .from('advisors')
    .select('*')
    .order('name');

  if (error) {
    console.error('Danışmanlar çekilemedi:', error);
    return [];
  }
  return data;
}

export async function getAdvisorBySlug(slug: string) {
  const { data, error } = await supabase
    .from('advisors')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Danışman detayı çekilemedi:', error);
    return null;
  }
  return data;
}
export async function getAllDistricts() {
  const { data, error } = await supabase
    .from('districts')
    .select('*')
    .order('name');

  if (error) {
    console.error('Tüm ilçeler çekilemedi:', error);
    return [];
  }
  return data;
}
export async function getMarketTrends() {
  const { data: properties, error } = await supabase
    .from('properties')
    .select('price, sqm, districts(name, slug)')
    .eq('status', 'aktif');

  if (error || !properties) return null;

  // Gerçek veri analitiği (Basitleştirilmiş versiyon - SQL View ile daha da güçlendirilebilir)
  const stats = properties.reduce((acc: any, curr: any) => {
    const district = curr.districts.name;
    if (!acc[district]) acc[district] = { totalSqm: 0, totalPrice: 0, count: 0 };
    acc[district].totalPrice += curr.price;
    acc[district].totalSqm += curr.sqm;
    acc[district].count += 1;
    return acc;
  }, {});

  return Object.keys(stats).map(name => ({
    name,
    avgPrice: Math.round(stats[name].totalPrice / stats[name].totalSqm),
    count: stats[name].count
  }));
}
