'use server'

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// Service role ile yetki kısıtlaması olmadan işlem yapıyoruz
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Taslak ilanı yayına alır
 */
export async function approvePropertyAction(id: string, lang: string) {
  try {
    const { error } = await supabase
      .from('properties')
      .update({ status: 'aktif' })
      .eq('id', id);

    if (error) throw error;
    
    // Sayfayı sunucu tarafında yenileyerek verinin güncel gelmesini sağlıyoruz
    revalidatePath(`/${lang}/admin`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * İlanı veritabanından tamamen siler
 */
export async function deletePropertyAction(id: string, lang: string) {
  try {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath(`/${lang}/admin`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * İlan durumunu değiştirir (Aktif/Pasif)
 */
export async function togglePropertyStatusAction(id: string, currentStatus: string, lang: string) {
  try {
    const newStatus = currentStatus === 'aktif' ? 'pasif' : 'aktif';
    const { error } = await supabase
      .from('properties')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) throw error;

    revalidatePath(`/${lang}/admin`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Sistem ayarlarını günceller (SaaS Core)
 */
export async function updateSettingsAction(settings: { key: string, value: string }[], lang: string) {
  try {
    for (const setting of settings) {
      const { error } = await supabase
        .from('settings')
        .update({ value: setting.value })
        .eq('key', setting.key);
      
      if (error) throw error;
    }

    revalidatePath(`/${lang}/admin`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Yeni ilan oluşturur (Resim yükleme dahil - Adım 3 & 4)
 */
export async function createPropertyAction(formData: FormData, lang: string) {
  try {
    const title = formData.get('title') as string;
    const price = parseInt(formData.get('price') as string);
    const district_id = formData.get('district_id') as string;
    const sqm = parseInt(formData.get('sqm') as string);
    const rooms = formData.get('rooms') as string;
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;
    const type = formData.get('type') as string;
    const files = formData.getAll('images') as File[];

    const uploadedImages = [];

    // 1. Resimleri Storage'a Yükle
    for (const file of files) {
      if (file.size > 0) {
        const fileName = `${Date.now()}_${file.name}`;
        const { data, error } = await supabase.storage
          .from('assets')
          .upload(`properties/${fileName}`, file);
        
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(data.path);
        uploadedImages.push(publicUrl);
      }
    }

    // 1.5 Otonom Çeviri (TR -> EN & AR)
    let descEn = '';
    let descAr = '';
    try {
      const { translateDescription } = await import('@/lib/ai');
      [descEn, descAr] = await Promise.all([
        translateDescription(description, 'en'),
        translateDescription(description, 'ar')
      ]);
    } catch (e) { console.error("Çeviri hatası:", e); }

    // 2. Veritabanına Kaydet
    const { error } = await supabase.from('properties').insert([{
      title,
      price,
      district_id,
      sqm,
      rooms,
      category,
      description,
      description_en: descEn,
      description_ar: descAr,
      status: 'aktif',
      images: uploadedImages,
      external_url: '' 
    }]);

    if (error) throw error;

    revalidatePath(`/${lang}/admin`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
