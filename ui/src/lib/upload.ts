import imageCompression from 'browser-image-compression';
import { api } from './api';

export type ImageType = 'menu' | 'logo' | 'banner' | 'receipt';

interface PresignedUrlResponse {
  uploadUrl: string;
  key: string;
  publicUrl: string;
}

const COMPRESSION_OPTIONS: Record<ImageType, { maxSizeMB: number; maxWidthOrHeight: number }> = {
  menu: { maxSizeMB: 0.5, maxWidthOrHeight: 1200 },
  logo: { maxSizeMB: 0.3, maxWidthOrHeight: 512 },
  banner: { maxSizeMB: 0.8, maxWidthOrHeight: 1920 },
  receipt: { maxSizeMB: 1, maxWidthOrHeight: 1600 },
};

export async function uploadImage(
  file: File,
  type: ImageType,
  onProgress?: (percent: number) => void,
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

  const { uploadUrl, publicUrl } = await api.post<PresignedUrlResponse>('/uploads/presigned-url', {
    type,
    contentType: 'image/webp',
  });

  onProgress?.(50);

  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/webp' },
    body: compressed,
  });

  if (!res.ok) throw new Error('Upload failed');

  onProgress?.(100);
  return publicUrl;
}
