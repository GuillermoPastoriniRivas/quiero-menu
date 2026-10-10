import { WhatsAppIcon } from '@/components/ui/brand-icons';
import { MaterialIcon } from '@/components/ui/material-icon';
import { supportWhatsAppUrl } from '@/lib/support';

export function SupportWhatsAppBanner({ restaurantName }: { restaurantName?: string }) {
  const href = supportWhatsAppUrl(
    restaurantName
      ? `Hola, soy de ${restaurantName} y necesito una mano con quiero.menu`
      : 'Hola, necesito una mano con quiero.menu',
  );

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-[#25D366]/30 bg-[#25D366]/5 p-5 sm:flex-row sm:items-center">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#25D366]/15 text-[#128C4A]">
        <MaterialIcon name="support_agent" size="md" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-[family-name:var(--font-heading)] font-bold text-on-surface">
          ¿Necesitás una mano?
        </p>
        <p className="mt-0.5 text-sm text-on-surface-variant">
          Escribinos por WhatsApp y te ayudamos con lo que necesites: cargar el menú, los pedidos o
          cambiar algo de tu local.
        </p>
      </div>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-bold text-white shadow-md shadow-[#25D366]/25 transition-colors hover:bg-[#1EBE5B]"
      >
        <WhatsAppIcon className="size-4" />
        Escribinos por WhatsApp
      </a>
    </section>
  );
}
