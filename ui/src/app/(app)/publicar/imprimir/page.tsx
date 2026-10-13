'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { useRestaurantStore } from '@/stores/restaurant.store';
import { BrandedQr } from '@/components/publicar/branded-qr';
import { Button } from '@/components/ui/button';
import { MaterialIcon } from '@/components/ui/material-icon';
import { WhatsAppIcon, InstagramIcon } from '@/components/ui/brand-icons';
import { waMeUrl } from '@/lib/utils';
import type { OperatingHours } from '@/types';
import { trackOwner } from '@/lib/behavior';

const SHORT_DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function hoursLabel(hours: OperatingHours[]): string | null {
  const open = hours
    .filter((h) => !h.isClosed)
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  if (!open.length) return hours.length ? 'Cerrado' : null;
  const same = (a: OperatingHours, b: OperatingHours) =>
    a.opensAt === b.opensAt && a.closesAt === b.closesAt;
  const first = open[0];
  if (open.every((h) => same(h, first))) {
    if (open.length === 7) return `Todos los días · ${first.opensAt} – ${first.closesAt}`;
    return `${open.map((h) => SHORT_DAYS[h.dayOfWeek]).join(', ')} · ${first.opensAt} – ${first.closesAt}`;
  }
  return open.map((h) => `${SHORT_DAYS[h.dayOfWeek]} ${h.opensAt}–${h.closesAt}`).join(' · ');
}

export default function ImprimirPage() {
  const { restaurant, operatingHours, fetch, fetchHours } = useRestaurantStore();
  const wrapRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [fitHeight, setFitHeight] = useState<number | null>(null);

  useEffect(() => {
    fetch();
    fetchHours();
  }, [fetch, fetchHours]);

  // En pantallas angostas la hoja A4 (210mm) no entra: la escalamos para previsualizarla
  // completa. En impresión se vuelve a escala 1 (ver @media print).
  useEffect(() => {
    const wrap = wrapRef.current;
    const sheet = sheetRef.current;
    if (!wrap || !sheet) return;
    const A4_PX = (210 * 96) / 25.4;
    const update = () => {
      const next = Math.min(1, wrap.clientWidth / A4_PX);
      setScale(next);
      setFitHeight(next < 1 ? Math.round(sheet.offsetHeight * next) : null);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(wrap);
    observer.observe(sheet);
    return () => observer.disconnect();
  }, [restaurant]);

  const brand = restaurant?.theme?.primaryColor || '#E8532C';

  const menuUrl = restaurant ? `${window.location.origin}/${restaurant.slug}` : '';
  const shortUrl = menuUrl.replace(/^https?:\/\//, '');

  const whatsapp = restaurant?.phone ? waMeUrl(restaurant.phone) : '';

  const instagramHandle = useMemo(() => {
    if (!restaurant?.socialLinks?.instagram) return '';
    return restaurant.socialLinks.instagram
      .replace(/^https?:\/\/(www\.)?instagram\.com\//, '')
      .replace(/^@/, '');
  }, [restaurant]);

  const address = restaurant?.address
    ? `${restaurant.address}${restaurant.city ? `, ${restaurant.city}` : ''}`
    : '';

  const hours = useMemo(
    () => hoursLabel(operatingHours ?? []),
    [operatingHours],
  );

  if (!restaurant) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div style={{ '--primary': brand } as CSSProperties}>
      {/* Toolbar (no se imprime) */}
      <div className="print-hidden mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-on-background" style={{ fontFamily: 'var(--font-heading)' }}>
            Hoja A4 para imprimir
          </h1>
          <p className="text-sm text-on-surface-variant">
            Lista para el local: QR, contacto y cómo pedir. Elegí Imprimir y guardala en PDF si querés.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/mi-menu?tab=compartir"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-4 h-10 text-sm font-semibold hover:bg-muted hover:text-foreground"
          >
            <MaterialIcon name="arrow_back" size="sm" />
            Volver
          </Link>
          <Button onClick={() => { trackOwner('qr_printed'); window.print(); }}>
            <MaterialIcon name="print" size="sm" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Hoja A4 */}
      <div
        ref={wrapRef}
        className="print-fit flex justify-center overflow-hidden"
        style={fitHeight ? { height: `${fitHeight}px` } : undefined}
      >
        <div className="print-scale shrink-0" style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
        <div ref={sheetRef} className="print-sheet w-[210mm] min-h-[297mm] bg-white text-on-surface flex flex-col shadow-ambient-lg rounded-2xl overflow-hidden">
          {/* Banda de marca */}
          <div className="rounded-[24px] bg-primary text-white mx-[8mm] mt-[8mm] p-[6mm] flex items-center gap-[5mm]">
            {/* eslint-disable-next-line @next/next/no-img-element -- imagen remota de usuario o logo local */}
            <img
              src={restaurant.logoUrl || '/logo.svg'}
              alt={restaurant.logoUrl ? restaurant.name : 'quiero.menu'}
              className="w-[16mm] h-[16mm] rounded-2xl object-cover bg-white/20 ring-2 ring-white/30 shrink-0"
            />
            <div className="min-w-0">
              <h2
                className="text-[22px] leading-tight font-extrabold tracking-tight text-white truncate"
                style={{ fontFamily: 'var(--font-logo)' }}
              >
                {restaurant.name}
              </h2>
              <p className="text-white/85 text-[12px] font-medium mt-[1mm]">
                Menú digital · pedí sin instalar nada
              </p>
            </div>
          </div>

          {/* QR */}
          <div className="flex flex-col items-center pt-[6mm] px-[8mm]">
            <h3
              className="text-[20px] font-extrabold tracking-tight text-on-background mb-[1mm]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              ¡Escaneá y pedí!
            </h3>
            <p className="text-[12px] text-on-surface-variant mb-[4mm]">
              Apuntá tu cámara al código para ver el menú
            </p>

            <div className="bg-white rounded-[20px] border-[3px] border-primary p-[4mm] shadow-ambient">
              <div className="w-[92mm] h-[92mm]">
                <BrandedQr
                  value={menuUrl}
                  size={520}
                  logoUrl={restaurant.logoUrl}
                  className="w-full h-full"
                />
              </div>
            </div>
            <p className="mt-[3mm] text-[13px] font-bold text-on-surface tracking-wide select-all">
              {shortUrl}
            </p>
          </div>

          {/* Pasos */}
          <div className="flex flex-wrap items-center justify-center gap-x-[8mm] gap-y-[3mm] pt-[6mm] px-[8mm]">
            {['Escaneá el código', 'Mirá el menú y elegí', 'Hacé tu pedido'].map((step, i) => (
              <div key={step} className="flex items-center gap-[3mm]">
                <span className="w-[9mm] h-[9mm] rounded-full bg-primary text-white flex items-center justify-center text-[16px] font-bold shrink-0">
                  {i + 1}
                </span>
                <span className="text-[13px] font-semibold text-on-surface">{step}</span>
              </div>
            ))}
          </div>

          {/* Contacto */}
          <div className="grid grid-cols-2 gap-[4mm] px-[8mm] pt-[6mm]">
            {whatsapp && (
              <div className="rounded-2xl bg-surface-container-low p-[4mm] flex items-center gap-[3mm]">
                <span className="rounded-xl bg-green-100 text-green-700 flex items-center justify-center shrink-0 w-[10mm] h-[10mm]">
                  <WhatsAppIcon />
                </span>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">WhatsApp</div>
                  <div className="text-[13px] font-bold text-on-surface break-words">{restaurant.phone}</div>
                </div>
              </div>
            )}
            {instagramHandle && (
              <div className="rounded-2xl bg-surface-container-low p-[4mm] flex items-center gap-[3mm]">
                <span className="rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center shrink-0 w-[10mm] h-[10mm]">
                  <InstagramIcon />
                </span>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Instagram</div>
                  <div className="text-[13px] font-bold text-on-surface break-words">@{instagramHandle}</div>
                </div>
              </div>
            )}
            {address && (
              <div className="rounded-2xl bg-surface-container-low p-[4mm] flex items-center gap-[3mm]">
                <span className="rounded-xl bg-primary-container/15 text-primary flex items-center justify-center shrink-0 w-[10mm] h-[10mm]">
                  <MaterialIcon name="location_on" size="sm" />
                </span>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Dirección</div>
                  <div className="text-[13px] font-bold text-on-surface break-words">{address}</div>
                </div>
              </div>
            )}
            {hours && (
              <div className="col-span-2 rounded-2xl bg-surface-container-low p-[4mm] flex items-center gap-[3mm]">
                <span className="rounded-xl bg-primary-container/15 text-primary flex items-center justify-center shrink-0 w-[10mm] h-[10mm]">
                  <MaterialIcon name="schedule" size="sm" />
                </span>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Horarios</div>
                  <div className="text-[13px] font-bold text-on-surface break-words">{hours}</div>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>

      {/* Reglas de impresion: A4 exacto, sin chrome del panel, con colores */}
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          html, body { background: #fff !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          aside, header, nav { display: none !important; }
          main { overflow: visible !important; padding: 0 !important; }
          main > div { max-width: none !important; padding: 0 !important; margin: 0 !important; }
          .print-hidden { display: none !important; }
          .print-sheet { box-shadow: none !important; border-radius: 0 !important; }
          .print-fit { height: auto !important; overflow: visible !important; }
          .print-scale { transform: none !important; }
        }
      `}</style>
    </div>
  );
}
