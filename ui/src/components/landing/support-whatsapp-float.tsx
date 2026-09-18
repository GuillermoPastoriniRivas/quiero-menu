import { WhatsAppIcon } from '@/components/ui/brand-icons';
import { waMeUrl } from '@/lib/utils';

export const SUPPORT_WHATSAPP_PHONE = '+598 91 935 507';
const SUPPORT_WA_URL = waMeUrl(SUPPORT_WHATSAPP_PHONE, 'Hola, tengo una consulta sobre quiero.menu');

export function SupportWhatsAppFloat() {
  return (
    <a
      href={SUPPORT_WA_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribinos por WhatsApp"
      className="group fixed bottom-24 right-4 z-50 flex items-center rounded-full bg-[#25D366] py-3.5 pl-4 pr-4 text-white shadow-xl shadow-black/20 transition-all hover:scale-105 hover:shadow-2xl sm:bottom-8 sm:right-8 lg:bottom-8 lg:right-6"
    >
      <WhatsAppIcon className="size-6 shrink-0" />
      <span className="max-w-0 overflow-hidden whitespace-nowrap font-[family-name:var(--font-heading)] text-sm font-bold opacity-0 transition-all duration-300 group-hover:ml-2.5 group-hover:max-w-48 group-hover:opacity-100 lg:group-hover:max-w-48">
        ¿Dudas? Escribinos
      </span>
    </a>
  );
}
