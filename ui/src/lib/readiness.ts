import type { ReadinessStep } from "@/types";

export interface ReadinessStepMeta {
  key: ReadinessStep;
  icon: string;
  label: string;
  title: string;
  doneTitle: string;
  why: string;
  cta: string;
  href: string;
}

export const READINESS_STEPS: ReadinessStepMeta[] = [
  {
    key: "menu",
    icon: "restaurant_menu",
    label: "Carta",
    title: "Cargá tu carta",
    doneTitle: "Carta cargada",
    why: "Sacale una foto a la carta y la IA arma los platos con sus precios. También podés cargarlos a mano.",
    cta: "Cargar la carta",
    href: "/menu",
  },
  {
    key: "whatsapp",
    icon: "chat",
    label: "WhatsApp",
    title: "Sumá el WhatsApp del local",
    doneTitle: "WhatsApp listo",
    why: "Es el botón que usan tus clientes para escribirte desde el menú. Tiene que ser un celular con código de área.",
    cta: "Cargar el WhatsApp",
    href: "/settings?tab=datos#whatsapp",
  },
  {
    key: "hours",
    icon: "schedule",
    label: "Horarios",
    title: "Definí tus horarios",
    doneTitle: "Horarios definidos",
    why: "Así tu menú muestra si estás abierto y nadie te pide cuando está cerrado.",
    cta: "Cargar horarios",
    href: "/settings?tab=horarios",
  },
  {
    key: "look",
    icon: "palette",
    label: "Imagen",
    title: "Poné tu logo y una portada",
    doneTitle: "Logo y portada listos",
    why: "Un menú con tu logo y una foto del local genera confianza y se comparte más.",
    cta: "Subir logo y portada",
    href: "/mi-menu?tab=diseno",
  },
  {
    key: "location",
    icon: "location_on",
    label: "Ubicación",
    title: "Marcá dónde estás",
    doneTitle: "Ubicación marcada",
    why: "Tu dirección aparece con el botón Cómo llegar y te ubica en el buscador de locales cercanos.",
    cta: "Marcar ubicación",
    href: "/settings?tab=datos#ubicacion",
  },
  {
    key: "payments",
    icon: "payments",
    label: "Cobro",
    title: "Elegí cómo cobrás",
    doneTitle: "Medios de cobro listos",
    why: "Si aceptás transferencia, cargá tu alias o CBU para que el cliente sepa a dónde pagar.",
    cta: "Configurar cobro",
    href: "/settings?tab=pagos",
  },
  {
    key: "shared",
    icon: "share",
    label: "Difusión",
    title: "Compartí tu link",
    doneTitle: "Link compartido",
    why: "Los primeros pedidos llegan de tus clientes de siempre: poné el link en tu Instagram y mandalo por WhatsApp.",
    cta: "Compartir mi menú",
    href: "/mi-menu?tab=compartir",
  },
  {
    key: "firstOrder",
    icon: "receipt_long",
    label: "Primer pedido",
    title: "Recibí tu primer pedido",
    doneTitle: "Primer pedido recibido",
    why: "Probalo vos: abrí tu menú, armá un pedido y mirá cómo te llega acá.",
    cta: "Hacer un pedido de prueba",
    href: "/orders",
  },
];

export const READINESS_BY_KEY: Record<ReadinessStep, ReadinessStepMeta> = Object.fromEntries(
  READINESS_STEPS.map((step) => [step.key, step]),
) as Record<ReadinessStep, ReadinessStepMeta>;

export const LISTING_STEP_KEYS: ReadinessStep[] = ["menu", "whatsapp", "hours", "look", "location"];

export function operateTargetFor(step: ReadinessStep): string {
  return READINESS_BY_KEY[step].href;
}
