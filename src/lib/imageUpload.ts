import { supabase } from './supabase';

export interface PartnerImage {
  id: string;
  partner_id: string;
  image_url: string;
  storage_path: string;
  image_type: 'logo' | 'product';
  caption?: string;
  display_order: number;
  created_at: string;
}

/**
 * Generates an optimized image URL with transformations for faster loading
 * Uses Supabase's image transformation API to resize and optimize images
 */
export function getOptimizedImageUrl(
  imageUrl: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'origin';
  } = {}
): string {
  const { width = 800, height, quality = 80, format = 'webp' } = options;

  try {
    const url = new URL(imageUrl);
    const params = new URLSearchParams();

    if (width) params.set('width', width.toString());
    if (height) params.set('height', height.toString());
    if (quality) params.set('quality', quality.toString());
    if (format !== 'origin') params.set('format', format);

    // Add resize mode for better image fitting
    params.set('resize', 'contain');

    url.search = params.toString();
    return url.toString();
  } catch (error) {
    // If URL parsing fails, return original URL
    console.warn('Failed to optimize image URL:', error);
    return imageUrl;
  }
}

export async function uploadPartnerImage(
  partnerId: string,
  file: File,
  imageType: 'logo' | 'product',
  caption?: string
): Promise<PartnerImage> {
  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${partnerId}/${Date.now()}.${fileExt}`;

    // Upload file to storage with optimized cache settings
    const { error: uploadError } = await supabase.storage
      .from('partner-images')
      .upload(fileName, file, {
        cacheControl: '31536000', // 1 year cache
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);

      // Check if it's a bucket not found error
      if (uploadError.message?.includes('not found') || uploadError.message?.includes('does not exist')) {
        throw new Error('Storage bucket "partner-images" does not exist. Please contact support.');
      }

      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('partner-images')
      .getPublicUrl(fileName);

    const maxOrder = await getMaxDisplayOrder(partnerId);

    const { data, error } = await supabase
      .from('partner_images')
      .insert([{
        partner_id: partnerId,
        image_url: publicUrl,
        storage_path: fileName,
        image_type: imageType,
        caption: caption,
        display_order: maxOrder + 1
      }])
      .select()
      .single();

    if (error) {
      console.error('Database insert error:', error);

      await supabase.storage
        .from('partner-images')
        .remove([fileName]);

      throw new Error(`Failed to save image info: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Image upload error:', error);
    throw error;
  }
}

async function getMaxDisplayOrder(partnerId: string): Promise<number> {
  const { data } = await supabase
    .from('partner_images')
    .select('display_order')
    .eq('partner_id', partnerId)
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.display_order ?? 0;
}

export async function getPartnerImages(partnerId: string): Promise<PartnerImage[]> {
  const { data, error } = await supabase
    .from('partner_images')
    .select('*')
    .eq('partner_id', partnerId)
    .order('display_order');

  if (error) {
    console.error('Error fetching partner images:', error);
    return [];
  }

  return data || [];
}

export async function deletePartnerImage(imageId: string, storagePath: string) {
  if (storagePath) {
    await supabase.storage
      .from('partner-images')
      .remove([storagePath]);
  }

  const { error } = await supabase
    .from('partner_images')
    .delete()
    .eq('id', imageId);

  if (error) throw error;
}

export async function updateImageOrder(imageId: string, newOrder: number) {
  const { error } = await supabase
    .from('partner_images')
    .update({ display_order: newOrder })
    .eq('id', imageId);

  if (error) throw error;
}

export async function reorderImages(partnerId: string, imageIds: string[]) {
  const updates = imageIds.map((id, index) =>
    supabase
      .from('partner_images')
      .update({ display_order: index })
      .eq('id', id)
      .eq('partner_id', partnerId)
  );

  await Promise.all(updates);
}
