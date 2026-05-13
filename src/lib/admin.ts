import { supabase } from './supabase';

/**
 * Görseli Supabase Storage 'assets' bucket'ına yükler
 */
export async function uploadImage(file: File, path: string) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `${path}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('assets')
    .upload(filePath, file);

  if (error) {
    throw error;
  }

  // Yüklenen dosyanın public URL'ini alıyoruz
  const { data: { publicUrl } } = supabase.storage
    .from('assets')
    .getPublicUrl(filePath);

  return publicUrl;
}

/**
 * Yeni ilan oluşturur
 */
export async function createProperty(propertyData: any) {
  const { data, error } = await supabase
    .from('properties')
    .insert([propertyData])
    .select();

  if (error) throw error;
  return data;
}

/**
 * İlan durumunu günceller (Aktif/Pasif/Taslak)
 */
export async function updatePropertyStatus(id: string, status: string) {
  const { data, error } = await supabase
    .from('properties')
    .update({ status })
    .eq('id', id);

  if (error) throw error;
  return data;
}

/**
 * İlanı tamamen siler
 */
export async function deleteProperty(id: string) {
  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

/**
 * Gelen tüm lead'leri (form başvurularını) getirir
 */
export async function getLeads() {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
