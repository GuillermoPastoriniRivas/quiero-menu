import imageCompression from 'browser-image-compression';
import { api } from './api';

export type ImageType = 'menu' | 'logo' | 'banner' | 'gallery' | 'receipt';

interface PresignedUrlResponse {
  uploadUrl: string;
  key: string;
  publicUrl: string;
}

const COMPRESSION_OPTIONS: Record<ImageType, { maxSizeMB: number; maxWidthOrHeight: number }> = {
  menu: { maxSizeMB: 0.5, maxWidthOrHeight: 1200 },
  logo: { maxSizeMB: 0.3, maxWidthOrHeight: 512 },
  banner: { maxSizeMB: 0.8, maxWidthOrHeight: 1920 },
  gallery: { maxSizeMB: 0.6, maxWidthOrHeight: 1600 },
  receipt: { maxSizeMB: 1, maxWidthOrHeight: 1600 },
};

export async function uploadImage(
  file: File,
  type: ImageType,
  onProgress?: (percent: number) => void,
  presignPath = '/uploads/presigned-url',
): Promise<string> {
  onProgress?.(10);

  const opts = COMPRESSION_OPTIONS[type];
  const compressed = await imageCompression(file, {
    maxSizeMB: opts.maxSizeMB,
    maxWidthOrHeight: opts.maxWidthOrHeight,
    fileType: 'image/webp',
    useWebWorker: true,
  });

  onProgress?.(30);

  const { uploadUrl, publicUrl } = await api.post<PresignedUrlResponse>(presignPath, {
    type,
    contentType: 'image/webp',
  });

  onProgress?.(50);

  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/webp' },
    body: compressed,
  });

  if (!res.ok) throw new Error('Error al subir la imagen');

  onProgress?.(100);
  return publicUrl;
}

export function uploadImageForRestaurant(restaurantId: string, file: File, type: ImageType): Promise<string> {
  return uploadImage(file, type, undefined, `/admin/restaurants/${restaurantId}/uploads/presigned-url`);
}
