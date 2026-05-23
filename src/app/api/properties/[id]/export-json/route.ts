import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service role kullanarak RLS'ten bağımsız güvenli okuma yapalım
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const propertyId = id;

    if (!propertyId) {
      return NextResponse.json({ error: 'İlan ID gereklidir.' }, { status: 400 });
    }

    // İlan detayını ilçesiyle birlikte çekelim
    const { data: prop, error } = await supabase
      .from('properties')
      .select('*, districts(name)')
      .eq('id', propertyId)
      .maybeSingle();

    if (error || !prop) {
      return NextResponse.json({ error: 'İlan bulunamadı.' }, { status: 404 });
    }

    // Yapılandırılmış temiz JSON çıktısı verelim
    const exportData = {
      id:            prop.id,
      title:         prop.title || '',
      price:         prop.price || 0,
      district:      prop.districts?.name || 'Çankaya',
      rooms:         prop.rooms || '3+1',
      sqm:           prop.sqm || 100,
      category:      prop.category || 'Konut',
      type:          prop.type || 'Satılık',
      description:   prop.description || '',
      images:        prop.images || [],
      created_at:    prop.created_at
    };

    return NextResponse.json({ success: true, property: exportData });

  } catch (error: any) {
    console.error('JSON dışa aktarım hatası:', error);
    return NextResponse.json({ error: 'Dışa aktarım sırasında hata oluştu.' }, { status: 500 });
  }
}
