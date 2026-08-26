'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { fetchImageAsDataUrl } from '@/lib/utils';

const API_URL =
  (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3015/api') + '/v1';

// Convierte la URL pública de una imagen (CloudFront/S3) a la del proxy del API,
// que sirve el objeto con CORS * (el CDN free tier no manda ACAO).
function imageProxyUrl(publicUrl: string): string {
  try {
    const url = new URL(publicUrl);
    const key = url.pathname.replace(/^\/+/, '');
    if (!key) return publicUrl;
    return `${API_URL}/uploads/image?key=${encodeURIComponent(key)}`;
  } catch {
    return publicUrl;
  }
}

interface BrandedQrProps {
  value: string;
  size?: number;
  logoUrl?: string;
  className?: string;
}

/**
 * QR con la marca del local: modulo negro (máxima escaneabilidad), logo
 * embebido al centro y nivel H de correccion de errores. El logo se baja a
 * data URL (via proxy del API para esquivar el CORS del CDN) para que la
 * exportacion a PNG no se manche por CORS.
 */
export function BrandedQr({
  value,
  size = 200,
  logoUrl,
  className,
}: BrandedQrProps) {
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const src = logoUrl && logoUrl.trim() ? logoUrl : '/logo.svg';
    const proxied = src.startsWith('http') ? imageProxyUrl(src) : src;
    fetchImageAsDataUrl(proxied)
      .then((dataUrl) => {
        if (!cancelled && dataUrl) setLogo(dataUrl);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [logoUrl]);

  return (
    <QRCodeSVG
      value={value}
      size={size}
      level="H"
      marginSize={4}
      bgColor="#ffffff"
      fgColor="#000000"
      className={className}
      title="Codigo QR del menu"
      imageSettings={
        logo
          ? {
              src: logo,
              height: Math.round(size * 0.22),
              width: Math.round(size * 0.22),
              excavate: true,
              opacity: 1,
            }
          : undefined
      }
    />
  );
}