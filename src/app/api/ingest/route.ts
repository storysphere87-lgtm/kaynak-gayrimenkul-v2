import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { checkLegalComplianceWithAI } from '@/lib/ai';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
};

// Tarayıcılar bazen gerçek istekten önce "OPTIONS" isteği gönderir (Preflight)
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== process.env.INGEST_API_KEY) {
      return NextResponse.json({ error: 'Yetkisiz Erişim' }, { status: 401, headers: corsHeaders });
    }

    const data = await request.json();
    if (!data.listing_id || !data.title) {
      return NextResponse.json({ error: 'Eksik veri' }, { status: 400, headers: corsHeaders });
    }

    // 1. Otonom Yapay Zeka Yasal Uyum Denetimi (Taşınmaz Ticareti Yönetmeliği)
    let finalStatus = 'aktif';
    let complianceWarning: string | null = null;
    
    if (data.description) {
      const compliance = await checkLegalComplianceWithAI(data.title, data.description);
      if (!compliance.is_compliant) {
        // Yasal uyumsuzluk tespit edildi -> İlanı otomatik taslak yap ve canlıya alma!
        finalStatus = 'taslak';
        complianceWarning = compliance.warning_reason;
        console.warn(`[Quantum Yasal Denetim] İlan yasal kuralları ihlal ediyor! Taslak olarak kaydedildi: ${compliance.warning_reason}`);
      }
    }

    const supabase = await createClient();
    const normalizedRooms = data.rooms?.replace(/\s+/g, '') || null;

    const { data: result, error } = await supabase
      .from('properties')
      .upsert({
        listing_id:        data.listing_id,
        title:             data.title,
        price:             data.price,
        city_name:         data.city_name,
        district_name:     data.district_name,
        quarter_name:      data.quarter_name,
        rooms:             normalizedRooms,
        sqm:               data.sqm,
        floor:             data.floor,
        building_age:      data.building_age,
        heating:           data.heating,
        images:            data.images,
        description:       data.description,
        external_url:      data.external_url,
        category:          data.category,
        source:            data.source || 'sahibinden',
        status:            finalStatus,
        e_devlet_verified: data.e_devlet_verified || false,
        tapu_kayit_no:     data.tapu_kayit_no || null,
        is_stealth:        data.is_stealth || false,
        updated_at:        new Date().toISOString(),
      }, {
        onConflict: 'listing_id'
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }

    return NextResponse.json({ 
      success: true, 
      id: result.id,
      compliance_compliant: !complianceWarning,
      compliance_warning: complianceWarning
    }, { headers: corsHeaders });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}

export async function GET(request: Request) {
  const apiKey = request.headers.get('x-api-key');
  if (apiKey !== process.env.INGEST_API_KEY) {
    return NextResponse.json({ error: 'Yetkisiz Erişim' }, { status: 401, headers: corsHeaders });
  }

  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get('listing_id');

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('properties')
    .select('id, listing_id')
    .eq('listing_id', listingId)
    .single();

  return NextResponse.json({ exists: !!data }, { headers: corsHeaders });
}
