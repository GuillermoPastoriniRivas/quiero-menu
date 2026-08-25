'use client';

import { useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRestaurantStore } from '@/stores/restaurant.store';
import { MaterialIcon } from '@/components/ui/material-icon';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BrandedQr } from '@/components/publicar/branded-qr';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function MiMenuPage() {
  const { restaurant, fetch: fetchRestaurant } = useRestaurantStore();
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchRestaurant();
  }, [fetchRestaurant]);

  const menuUrl = typeof window !== 'undefined' && restaurant
    ? `${window.location.origin}/${restaurant.slug}`
    : '';

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(menuUrl);
    toast.success('Link copiado');
  }, [menuUrl]);

  const openMenu = useCallback(() => {
    window.open(menuUrl, '_blank');
  }, [menuUrl]);

  const downloadQR = useCallback(() => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const size = 1024;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      const link = document.createElement('a');
      link.download = `menu-qr-${restaurant?.slug || 'code'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }, [restaurant?.slug]);

  if (!restaurant) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <section className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-on-background" style={{ fontFamily: 'var(--font-heading)' }}>
          Menu Digital
        </h1>
        <p className="text-on-surface-variant text-lg">
          Este es tu link unico. Compartilo para que tus clientes vean tu menu y te hagan pedidos.
        </p>
      </section>

      {/* Link Card */}
      <Card>
        <CardContent className="py-2 space-y-4">
            <h2 className="text-xl font-bold text-on-surface" style={{ fontFamily: 'var(--font-heading)' }}>
              Comparte tu menu
            </h2>
            <p className="text-sm text-on-surface-variant">
              Envialo por WhatsApp, ponelo en tu bio de Instagram o compartilo en redes.
            </p>
          {/* URL display */}
          <div className="bg-surface-container-low rounded-xl px-4 py-3 flex items-center gap-3">
            <MaterialIcon name="link" size="md" className="text-primary shrink-0" />
            <span className="text-base font-bold text-on-surface truncate select-all">
              {menuUrl.replace(/^https?:\/\//, '')}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button onClick={copyLink} className="flex-1 gradient-cta text-white font-bold">
              <MaterialIcon name="content_copy" size="sm" />
              Copiar link
            </Button>
            <Button onClick={openMenu} variant="outline" className="flex-1 font-bold">
              <MaterialIcon name="open_in_new" size="sm" />
              Abrir
            </Button>
          </div>
          
        </CardContent>
      </Card>

      {/* QR Code Card */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold text-on-surface" style={{ fontFamily: 'var(--font-heading)' }}>
              Codigo QR
            </h2>
            <p className="text-sm text-on-surface-variant">
              Imprimilo y ponelo en tu local para que tus clientes escaneen y hagan pedidos.
            </p>
          </div>

          <div ref={qrRef} className="flex justify-center py-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-outline-variant/10">
              <BrandedQr
                value={menuUrl}
                size={200}
                logoUrl={restaurant.logoUrl}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button onClick={downloadQR} variant="outline" className="font-bold">
              <MaterialIcon name="download" size="sm" />
              Descargar QR
            </Button>
            <Link
              href="/publicar/imprimir"
              className={cn(buttonVariants({ variant: 'outline' }), 'font-bold')}
            >
              <MaterialIcon name="print" size="sm" />
              Hoja A4 para imprimir
            </Link>
          </div>

          <p className="text-xs text-on-surface-variant text-center">
            El QR lleva tu color y tu logo. Imprimilo solo o con la hoja A4, que incluye tus
            datos de contacto para poner en el local.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
