import { waMeUrl } from '@/lib/utils';

export const SUPPORT_WHATSAPP_PHONE = '+54 9 3442 490470';

/** URL de WhatsApp del equipo de quiero.menu, con mensaje precargado opcional. */
export function supportWhatsAppUrl(message?: string): string {
  return waMeUrl(SUPPORT_WHATSAPP_PHONE, message);
}
