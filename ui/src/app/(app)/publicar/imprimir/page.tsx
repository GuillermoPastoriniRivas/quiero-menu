'use client';

import { useEffect, useMemo, type CSSProperties } from 'react';
import Link from 'next/link';
import { useRestaurantStore } from '@/stores/restaurant.store';
import { BrandedQr } from '@/components/publicar/branded-qr';
import { Button } from '@/components/ui/button';
import { MaterialIcon } from '@/components/ui/material-icon';
import { WhatsAppIcon, InstagramIcon } from '@/components/ui/brand-icons';
import { waMeUrl } from '@/lib/utils';
import type { OperatingHours } from '@/types';

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

  useEffect(() => {
    fetch();
    fetchHours();
  }, [fetch, fetchHours]);

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
            href="/publicar"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-4 h-10 text-sm font-semibold hover:bg-muted hover:text-foreground"
          >
            <MaterialIcon name="arrow_back" size="sm" />
            Volver
          </Link>
          <Button onClick={() => window.print()}>
            <MaterialIcon name="print" size="sm" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Hoja A4 */}
      <div className="flex justify-center overflow-x-auto">
        <div className="print-sheet w-[210mm] min-h-[297mm] bg-white text-on-surface flex flex-col shadow-ambient-lg rounded-2xl overflow-hidden">
          {/* Banda de marca */}
          <div className="rounded-[28px] bg-primary text-white mx-[10mm] mt-[10mm] p-[8mm] flex items-center gap-[6mm]">
            {/* eslint-disable-next-line @next/next/no-img-element -- imagen remota de usuario o logo local */}
            <img
              src={restaurant.logoUrl || '/logo.svg'}
              alt={restaurant.logoUrl ? restaurant.name : 'quiero.menu'}
              className="w-[20mm] h-[20mm] rounded-2xl object-cover bg-white/20 ring-2 ring-white/30 shrink-0"
            />
            <div className="min-w-0">
              <h2
                className="text-[26px] leading-tight font-extrabold tracking-tight text-white truncate"
                style={{ fontFamily: 'var(--font-logo)' }}
              >
                {restaurant.name}
              </h2>
              <p className="text-white/85 text-[13px] font-medium mt-[1mm]">
                Menú digital · pedí sin instalar nada
              </p>
            </div>
          </div>

          {/* QR */}
          <div className="flex flex-col items-center pt-[10mm] px-[10mm]">
            <h3
              className="text-[22px] font-extrabold tracking-tight text-on-background mb-[1mm]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              ¡Escaneá y pedí!
            </h3>
            <p className="text-[13px] text-on-surface-variant mb-[5mm]">
              Apuntá tu cámara al código para ver el menú
            </p>

            <div className="bg-white rounded-[20px] border-[3px] border-primary p-[6mm] shadow-ambient">
              <div className="w-[118mm] h-[118mm]">
                <BrandedQr
                  value={menuUrl}
                  size={520}
                  logoUrl={restaurant.logoUrl}
                  className="w-full h-full"
                />
              </div>
            </div>
            <p className="mt-[4mm] text-[14px] font-bold text-on-surface tracking-wide select-all">
              {shortUrl}
            </p>
          </div>

          {/* Pasos */}
          <div className="flex flex-wrap items-center justify-center gap-x-[8mm] gap-y-[3mm] pt-[8mm] px-[10mm]">
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
          <div className="grid grid-cols-2 gap-[4mm] px-[10mm] pt-[8mm]">
            {whatsapp && (
              <div className="rounded-2xl bg-surface-container-low p-[5mm] flex items-center gap-[4mm]">
                <span className="w-[12mm] h-[12mm] rounded-xl bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                  <WhatsAppIcon />
                </span>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">WhatsApp</div>
                  <div className="text-[15px] font-bold text-on-surface break-words">{restaurant.phone}</div>
                </div>
              </div>
            )}
            {instagramHandle && (
              <div className="rounded-2xl bg-surface-container-low p-[5mm] flex items-center gap-[4mm]">
                <span className="w-[12mm] h-[12mm] rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center shrink-0">
                  <InstagramIcon />
                </span>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Instagram</div>
                  <div className="text-[15px] font-bold text-on-surface break-words">@{instagramHandle}</div>
                </div>
              </div>
            )}
            {address && (
              <div className="rounded-2xl bg-surface-container-low p-[5mm] flex items-center gap-[4mm]">
                <span className="w-[12mm] h-[12mm] rounded-xl bg-primary-container/15 text-primary flex items-center justify-center shrink-0">
                  <MaterialIcon name="location_on" size="sm" />
                </span>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Dirección</div>
                  <div className="text-[15px] font-bold text-on-surface break-words">{address}</div>
                </div>
              </div>
            )}
            {hours && (
              <div className="rounded-2xl bg-surface-container-low p-[5mm] flex items-center gap-[4mm]">
                <span className="w-[12mm] h-[12mm] rounded-xl bg-primary-container/15 text-primary flex items-center justify-center shrink-0">
                  <MaterialIcon name="schedule" size="sm" />
                </span>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Horarios</div>
                  <div className="text-[15px] font-bold text-on-surface break-words">{hours}</div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-auto px-[10mm] pb-[8mm] pt-[10mm]">
            <div className="border-t border-outline-variant/40 pt-[5mm] flex items-center justify-between text-[12px] text-on-surface-variant">
              <span className="font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-logo)' }}>
                quiero
                <span className="text-primary">.menu</span>
              </span>
              <span className="font-medium">
                Creado con quiero.menu · {shortUrl}
              </span>
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
        }
      `}</style>
    </div>
  );
}