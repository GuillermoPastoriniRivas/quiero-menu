import Link from 'next/link';
import type { Metadata } from 'next';
import { QRCodeSVG } from 'qrcode.react';
import { MaterialIcon } from '@/components/ui/material-icon';
import { Logo } from '@/components/ui/logo';
import { CookielessAnalytics } from '@/components/analytics/cookieless-analytics';
import { LandingNav } from '@/components/landing/landing-nav';
import { MenuDemo } from '@/components/landing/menu-demo';
import { PanelMock } from '@/components/landing/panel-mock';
import { StickyCta } from '@/components/landing/sticky-cta';

export const metadata: Metadata = {
  title: { absolute: 'Menú Digital Gratis | Creá tu menú online en 5 minutos' },
  description:
    'Creá tu menú digital gratis y sin tarjeta. Compartilo por WhatsApp o con un QR en tu local y recibí pedidos directos, sin comisiones por pedido.',
  keywords: [
    'menu digital gratis',
    'menú digital gratis',
    'menu digital',
    'menu QR gratis',
    'carta digital gratis',
    'menu online restaurante',
    'pedidos por whatsapp',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: 'https://quiero.menu',
    siteName: 'quiero.menu',
    title: 'Menú Digital Gratis | Creá tu menú online en 5 minutos',
    description:
      'Creá tu menú digital gratis y sin tarjeta. Compartilo por WhatsApp o con un QR en tu local y recibí pedidos directos, sin comisiones por pedido.',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'quiero.menu - Menú digital gratis para restaurantes',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Menú Digital Gratis | Creá tu menú online en 5 minutos',
    description:
      'Creá tu menú digital gratis y sin tarjeta. Compartilo por WhatsApp o con un QR en tu local y recibí pedidos directos, sin comisiones por pedido.',
    images: ['/og.png'],
  },
};

const LIVE_STORES = [
  { slug: 'leonardos', name: "Leonardo's", place: 'Concepción del Uruguay, AR' },
  { slug: 'la-famosa', name: 'La Famosa', place: 'Paysandú, UY' },
  { slug: 'pizza-libre', name: 'Pizza Quir', place: 'Zipaquirá, CO' },
];

const STEPS = [
  {
    icon: 'photo_camera',
    title: 'Sacale una foto a tu menú',
    text: 'La IA lee tus platos, descripciones y precios, y te los deja cargados. Si preferís, los escribís a mano.',
    chip: 'Menos de 5 minutos',
  },
  {
    icon: 'qr_code_2',
    title: 'Compartí tu link o pegá el QR',
    text: 'Va en la bio de Instagram, en el estado de WhatsApp y en cada mesa. Te damos la hoja lista para imprimir.',
    chip: 'quiero.menu/tu-local',
  },
  {
    icon: 'receipt_long',
    title: 'Los pedidos te llegan armados',
    text: 'Con nombre, dirección, forma de pago y total. Se acabó anotar en un papel y equivocarse en la comanda.',
    chip: 'Sin errores de comanda',
  },
];

const PANEL_POINTS = [
  ['notifications_active', 'Suena cuando entra un pedido', 'Aunque tengas el celular en el bolsillo y el local lleno.'],
  ['monitor', 'Pantalla aparte para la cocina', 'La cocina ve lo que tiene que preparar sin tocar tu panel.'],
  ['block', 'Pausás un plato en dos toques', 'Se te acabó la mozzarella: lo pausás y deja de aparecer al instante.'],
  ['insights', 'Sabés qué se vende y a qué hora', 'Tus platos más pedidos y tus horas pico, sin planillas.'],
] as const;

const SITUATIONS = [
  {
    icon: 'chat',
    title: 'Tomás pedidos por WhatsApp',
    text: 'Te ordena el ida y vuelta: el cliente arma el pedido solo y a vos te llega listo.',
  },
  {
    icon: 'storefront',
    title: 'Atendés en el local',
    text: 'Un QR en cada mesa y en el mostrador. Piden sin esperar a que alguien los atienda.',
  },
  {
    icon: 'delivery_dining',
    title: 'Ya vendés por una app',
    text: 'Sumás tu canal propio, sin comisión, para los clientes que ya te conocen.',
  },
];

const MARQUEE_ITEMS = [
  ['local_pizza', 'Pizzerías'],
  ['lunch_dining', 'Hamburgueserías'],
  ['restaurant', 'Rotiserías'],
  ['local_cafe', 'Cafeterías'],
  ['icecream', 'Heladerías'],
  ['bakery_dining', 'Panaderías'],
  ['ramen_dining', 'Sushi y delivery'],
  ['local_bar', 'Bares'],
] as const;

const STATS = [
  { value: '$0', label: 'de comisión por pedido', detail: 'Hoy y siempre' },
  { value: '100', label: 'pedidos por mes gratis', detail: 'Sin tarjeta de crédito' },
  { value: '5 min', label: 'de foto a link publicado', detail: 'La IA carga tus platos' },
  { value: '24/7', label: 'recibiendo pedidos solos', detail: 'Ni feriados ni lluvia' },
];

const faqs = [
  {
    q: '¿Cuánto tardo en tener mi menú andando?',
    a: 'Menos de 10 minutos. Subís una foto de tu menú físico y la IA carga los platos y los precios por vos; después revisás, corregís lo que quieras y publicás.',
  },
  {
    q: '¿Mis clientes tienen que descargar una app?',
    a: 'No. Entran desde un link o escaneando el QR de la mesa, y ven tu menú en el navegador del celular. No hay registro, ni descarga, ni contraseñas.',
  },
  {
    q: '¿Cómo cobro los pedidos?',
    a: 'Como ya lo hacés hoy: en efectivo al retirar o contra entrega, o por transferencia. quiero.menu le muestra al cliente los datos de tu banco y el comprobante lo sube directo en el seguimiento del pedido.',
  },
  {
    q: '¿Y si no estoy en ninguna app de delivery?',
    a: 'Mejor todavía. quiero.menu no viene a reemplazar una app: te da tu propio canal. Si hoy tomás pedidos por WhatsApp, por teléfono o en el mostrador, te los ordena y te los deja armados, sin depender de nadie.',
  },
  {
    q: '¿Me cobran comisión por pedido?',
    a: 'Nunca. Ni en el plan gratis ni en Pro. El 100% de cada pedido es tuyo: nosotros cobramos una suscripción fija y nada más.',
  },
  {
    q: '¿Cómo me entero de que entró un pedido?',
    a: 'Suena una notificación en tu panel y te llega el aviso al celular. Si querés, el pedido armado te llega también a tu WhatsApp.',
  },
  {
    q: '¿Hay límite de productos o categorías?',
    a: 'No. Cargás todos los platos y todas las categorías que necesites, también en el plan gratis.',
  },
  {
    q: '¿Qué pasa si me quedo sin stock de algo?',
    a: 'Lo pausás desde el celular y deja de aparecer como disponible al instante. Cuando vuelve, lo reactivás.',
  },
  {
    q: '¿Y si quiero dejarlo?',
    a: 'Cancelás cuando quieras, sin permanencia ni llamados. Tu información es tuya y te la llevás.',
  },
];

const webSiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'quiero.menu',
  url: 'https://quiero.menu',
  description:
    'Creá tu menú digital gratis para tu restaurante y recibí pedidos directos por WhatsApp o QR, sin comisiones por pedido.',
  inLanguage: 'es-AR',
};

const softwareApplicationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'quiero.menu',
  url: 'https://quiero.menu',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description:
    'Menú digital gratis con pedidos directos por WhatsApp o QR, seguimiento del pedido en vivo y pagos por transferencia o efectivo.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'ARS',
    description: 'Plan gratuito hasta 100 pedidos al mes. Plan Pro ARS 15.000 al mes.',
  },
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: f.a,
    },
  })),
};

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}

function Reassurance({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  return (
    <p
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-sm ${
        tone === 'dark' ? 'text-white/65' : 'text-on-surface-variant'
      }`}
    >
      {['Sin tarjeta de crédito', 'Listo en 5 minutos', 'Cancelás cuando quieras'].map((t) => (
        <span key={t} className="flex items-center gap-1.5">
          <MaterialIcon name="check_circle" size="xs" className="text-success" />
          {t}
        </span>
      ))}
    </p>
  );
}

function SectionLabel({ children, tone = 'light' }: { children: React.ReactNode; tone?: 'light' | 'dark' }) {
  return (
    <p
      className={`font-[family-name:var(--font-heading)] text-xs font-bold uppercase tracking-[0.2em] ${
        tone === 'dark' ? 'text-primary-fixed-dim' : 'text-primary'
      }`}
    >
      {children}
    </p>
  );
}

function PrimaryCta({
  className = '',
  size = 'lg',
}: {
  className?: string;
  size?: 'md' | 'lg';
}) {
  return (
    <Link
      href="/signup"
      className={`btn-shimmer gradient-cta group relative flex items-center justify-center gap-2 overflow-hidden rounded-2xl font-bold text-white shadow-xl shadow-primary/25 transition-transform hover:scale-[1.02] ${
        size === 'lg' ? 'px-8 py-4 text-lg' : 'px-6 py-3.5'
      } ${className}`}
    >
      <span className="relative">Crear mi menú gratis</span>
      <MaterialIcon
        name="arrow_forward"
        size="sm"
        className="relative transition-transform group-hover:translate-x-1"
      />
    </Link>
  );
}

function HeroFloatCard({
  icon,
  title,
  sub,
  className,
  delay = '0s',
}: {
  icon: string;
  title: string;
  sub: string;
  className: string;
  delay?: string;
}) {
  return (
    <div aria-hidden className={`pointer-events-none absolute z-30 hidden md:block ${className}`}>
      <div
        className="animate-float flex items-center gap-3 rounded-2xl border border-outline-variant/40 bg-white/90 px-4 py-3 shadow-ambient-lg backdrop-blur"
        style={{ animationDelay: delay }}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <MaterialIcon name={icon} size="sm" />
        </span>
        <span>
          <span className="block whitespace-nowrap font-[family-name:var(--font-heading)] text-[13px] font-extrabold text-on-surface">
            {title}
          </span>
          <span className="block whitespace-nowrap text-xs text-on-surface-variant">{sub}</span>
        </span>
      </div>
    </div>
  );
}

function RubroMarquee() {
  const row = (hidden: boolean) => (
    <div aria-hidden={hidden || undefined} className="flex w-max shrink-0 items-center gap-12 pr-12">
      {MARQUEE_ITEMS.map(([icon, label]) => (
        <span key={label} className="flex items-center gap-2.5 whitespace-nowrap">
          <MaterialIcon name={icon} size="sm" className="text-primary" fill />
          <span className="font-[family-name:var(--font-heading)] text-sm font-bold uppercase tracking-wider text-on-surface-variant">
            {label}
          </span>
        </span>
      ))}
    </div>
  );

  return (
    <section className="border-y border-outline-variant/40 bg-surface-container-lowest py-5">
      <div className="marquee marquee-mask overflow-hidden">
        <div className="marquee-track flex w-max">
          {row(false)}
          {row(true)}
        </div>
      </div>
    </section>
  );
}

function QrCardVisual() {
  return (
    <div className="relative mt-5 inline-flex rounded-3xl bg-surface-container-low p-4 ring-1 ring-outline-variant/40">
      <QRCodeSVG
        value="https://quiero.menu/tu-local"
        size={104}
        bgColor="transparent"
        fgColor="#261815"
        level="M"
      />
      <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-ambient ring-1 ring-outline-variant/40">
        <MaterialIcon name="print" size="xs" className="text-primary" />
      </span>
    </div>
  );
}

function CouponCardVisual() {
  return (
    <div
      aria-hidden
      className="relative mt-5 overflow-hidden rounded-2xl border-2 border-dashed border-primary/50 bg-primary/5 px-4 py-3"
    >
      <p className="font-[family-name:var(--font-heading)] text-[11px] font-bold uppercase tracking-widest text-primary">
        Martes de pizzas
      </p>
      <p className="mt-0.5 font-[family-name:var(--font-heading)] text-3xl font-extrabold text-gradient-brand">
        −20%
      </p>
      <span className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-surface-container-lowest ring-1 ring-primary/30" />
      <span className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-surface-container-lowest ring-1 ring-primary/30" />
    </div>
  );
}

function CustomersCardVisual() {
  const bars = [
    ['L', 34],
    ['M', 52],
    ['M', 44],
    ['J', 68],
    ['V', 92],
    ['S', 78],
    ['D', 58],
  ] as const;

  return (
    <div aria-hidden className="mt-5 flex h-24 items-end gap-1.5">
      {bars.map(([day, h], i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <div
            className={`w-full rounded-t-md ${
              i === 4 ? 'gradient-cta' : 'bg-primary/15'
            }`}
            style={{ height: `${h}%` }}
          />
          <span
            className={`text-[10px] font-bold ${i === 4 ? 'text-primary' : 'text-on-surface-variant/60'}`}
          >
            {day}
          </span>
        </div>
      ))}
    </div>
  );
}

function DomainCardVisual() {
  return (
    <div
      aria-hidden
      className="mt-5 flex items-center gap-2 rounded-xl bg-surface-container-low px-3 py-2.5 ring-1 ring-outline-variant/40"
    >
      <MaterialIcon name="language" size="sm" className="shrink-0 text-primary" />
      <span className="truncate font-mono text-sm font-semibold text-on-surface">tulocal.com</span>
      <MaterialIcon name="arrow_outward" size="xs" className="ml-auto shrink-0 text-success" />
    </div>
  );
}

function PaymentsCardVisual() {
  return (
    <div aria-hidden className="mt-5 grid grid-cols-2 gap-2">
      <span className="flex items-center gap-1.5 rounded-xl border-2 border-primary bg-primary/5 px-3 py-2.5 text-xs font-bold text-primary">
        <MaterialIcon name="payments" size="xs" />
        Efectivo
      </span>
      <span className="flex items-center gap-1.5 rounded-xl border border-outline-variant/60 bg-surface px-3 py-2.5 text-xs font-bold text-on-surface-variant">
        <MaterialIcon name="account_balance" size="xs" />
        Transferencia
      </span>
    </div>
  );
}

function BrandCardVisual() {
  return (
    <div aria-hidden className="mt-5 overflow-hidden rounded-2xl ring-1 ring-outline-variant/40">
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element -- mockup estático servido desde /public, sin optimizador */}
        <img src="/demo/cover-pizzeria.webp" alt="" width={640} height={320} loading="lazy" className="h-28 w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
        <div className="absolute bottom-2 left-3 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white">
            <MaterialIcon name="local_pizza" size="xs" fill />
          </span>
          <span className="text-xs font-extrabold text-white">Tu local</span>
        </div>
      </div>
      <div className="flex items-center gap-2 bg-surface-container-lowest px-3 py-2.5">
        <span className="text-[11px] font-bold text-on-surface-variant">Colores:</span>
        {['#E8532C', '#F59E0B', '#0F766E', '#1E293B'].map((c) => (
          <span key={c} className="h-4 w-4 rounded-full ring-2 ring-white shadow-sm" style={{ backgroundColor: c }} />
        ))}
        <span className="ml-auto flex items-center gap-1 text-[11px] font-bold text-primary">
          <MaterialIcon name="palette" size="xs" />
          Tu logo
        </span>
      </div>
    </div>
  );
}

const BENTO_FEATURES = [
  {
    title: 'Tu local, con tu cara',
    text: 'Colores, logo, portada y descripción. No parece una plantilla más: parece tuyo.',
    visual: BrandCardVisual,
    span: 'lg:col-span-2',
  },
  {
    title: 'QR listo para imprimir',
    text: 'Hoja A4 con tu QR, tu contacto y las instrucciones. La imprimís y la pegás en la mesa.',
    visual: QrCardVisual,
    span: '',
  },
  {
    title: 'Cupones para llenar los días flojos',
    text: 'Armás un descuento para el martes a la noche y lo compartís por WhatsApp.',
    visual: CouponCardVisual,
    span: '',
  },
  {
    title: 'Tus clientes son tuyos',
    text: 'Quién te compró, qué pidió y cuánto gastó. Ninguna app se queda con esa lista.',
    visual: CustomersCardVisual,
    span: '',
  },
  {
    title: 'Tu propio dominio',
    text: 'tulocal.com apuntando a tu menú, con certificado incluido.',
    pro: true,
    visual: DomainCardVisual,
    span: '',
  },
  {
    title: 'Cobrás como cobrás hoy',
    text: 'Efectivo o transferencia. El cliente sube el comprobante ahí mismo y vos lo ves en el pedido.',
    visual: PaymentsCardVisual,
    span: 'lg:col-span-3 lg:flex lg:items-center lg:justify-between',
  },
] as const;

function WhatsAppMock() {
  return (
    <div className="mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-outline-variant/50 bg-[#0b141a] shadow-ambient-lg">
      <div className="flex items-center gap-3 bg-[#1f2c33] px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-primary">
          <MaterialIcon name="local_pizza" size="sm" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">Pizzería Napoli</p>
          <p className="text-[11px] text-white/50">en línea</p>
        </div>
      </div>
      <div className="space-y-2.5 bg-[#0b141a] px-4 py-5">
        <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-[#005c4b] px-3.5 py-2.5">
          <p className="text-[13px] leading-relaxed text-white">
            Hola! Te paso mi pedido 🍕
          </p>
          <p className="mt-1 text-right text-[10px] text-white/50">21:14 ✓✓</p>
        </div>
        <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-[#1f2c33] px-3.5 py-2.5">
          <p className="text-[13px] leading-relaxed text-white/90">
            ¡Recibido! Seguí tu pedido acá 👇
          </p>
          <p className="mt-1 truncate text-[12px] font-semibold text-[#53bdeb]">
            quiero.menu/p/1042
          </p>
          <p className="mt-1 text-right text-[10px] text-white/40">21:14</p>
        </div>
        <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-[#1f2c33] px-3.5 py-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary">
              <MaterialIcon name="local_shipping" size="xs" />
            </span>
            <p className="text-[13px] font-semibold text-white/90">Tu pedido salió del local</p>
          </div>
          <p className="mt-1 text-right text-[10px] text-white/40">21:38</p>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="overflow-x-clip bg-surface text-on-surface">
      <CookielessAnalytics />
      <JsonLd data={webSiteJsonLd} />
      <JsonLd data={softwareApplicationJsonLd} />
      <JsonLd data={faqJsonLd} />

      <LandingNav />
      <StickyCta />

      <main className="pt-16">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden">
          <div aria-hidden className="absolute inset-0 -z-10">
            <div className="landing-aurora absolute inset-0" />
            <div className="animate-orb absolute -top-24 right-[12%] h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
            <div
              className="animate-orb absolute left-[4%] top-48 h-72 w-72 rounded-full bg-[#ff9a3c]/20 blur-3xl"
              style={{ animationDelay: '-8s' }}
            />
            <div className="landing-dots absolute inset-0" />
          </div>

          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-12 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:pb-28 lg:pt-16">
            <div>
              <span className="hero-in inline-flex items-center gap-2 rounded-full border border-success/25 bg-success-container px-3.5 py-1.5 text-xs font-bold text-on-success-container">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping-soft absolute inline-flex h-full w-full rounded-full bg-success" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                </span>
                Gratis hasta 100 pedidos por mes · sin tarjeta
              </span>

              <h1 className="mt-7 font-[family-name:var(--font-heading)] text-[3rem] font-extrabold leading-[0.96] tracking-[-0.04em] text-balance sm:text-7xl xl:text-[5.25rem]">
                <span className="-mb-[0.12em] block overflow-hidden pb-[0.12em]">
                  <span className="hero-in block" style={{ '--d': '90ms' } as React.CSSProperties}>
                    Pedidos directos.
                  </span>
                </span>
                <span className="block overflow-hidden pb-[0.14em]">
                  <span
                    className="hero-in block text-gradient-brand"
                    style={{ '--d': '190ms' } as React.CSSProperties}
                  >
                    Sin comisiones.
                  </span>
                </span>
              </h1>

              <p
                className="hero-in mt-7 max-w-xl text-lg leading-relaxed text-on-surface-variant text-pretty sm:text-xl"
                style={{ '--d': '300ms' } as React.CSSProperties}
              >
                Armá tu <strong className="font-semibold text-on-surface">menú digital gratis</strong> y
                compartilo por WhatsApp o con un QR. El cliente arma solo, y a vos te llega el pedido
                listo: dirección, forma de pago y total.
              </p>

              <div
                className="hero-in mt-9 flex flex-col gap-3 sm:flex-row"
                style={{ '--d': '400ms' } as React.CSSProperties}
              >
                <PrimaryCta />
                <a
                  href="/leonardos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-2xl border border-outline-variant bg-surface-container-lowest px-7 py-4 text-lg font-bold text-on-surface transition-colors hover:border-primary/50 hover:text-primary"
                >
                  Ver un menú real
                  <MaterialIcon name="open_in_new" size="sm" />
                </a>
              </div>

              <div className="hero-in mt-7" style={{ '--d': '500ms' } as React.CSSProperties}>
                <Reassurance />
              </div>
            </div>

            <div className="hero-in relative" style={{ '--d': '250ms' } as React.CSSProperties}>
              <HeroFloatCard
                icon="notifications_active"
                title="Entró un pedido nuevo"
                sub="#1043 · armado y completo"
                className="-left-2 top-6 lg:-left-10"
                delay="1.4s"
              />
              <HeroFloatCard
                icon="savings"
                title="$0 de comisión"
                sub="El 100% del pedido es tuyo"
                className="-right-2 bottom-10 lg:-right-6"
                delay="-2.8s"
              />

              <div className="[perspective:1400px]">
                <div className="transition-transform duration-700 ease-out lg:[transform:rotateY(-8deg)_rotateX(3deg)] lg:hover:[transform:rotateY(-2deg)_rotateX(0deg)]">
                  <MenuDemo />
                </div>
              </div>
            </div>
          </div>

          <div aria-hidden className="landing-hairline mx-auto h-px max-w-5xl" />
        </section>

        {/* ── Marquee de rubros ── */}
        <RubroMarquee />

        {/* ── Números reales del producto ── */}
        <section className="bg-surface-container-low py-16 sm:py-20">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-10 px-5 text-center sm:px-8 lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="reveal">
                <p className="text-gradient-brand font-[family-name:var(--font-heading)] text-5xl font-extrabold tracking-tight sm:text-6xl">
                  {s.value}
                </p>
                <p className="mt-2 font-[family-name:var(--font-heading)] text-sm font-bold text-on-surface sm:text-base">
                  {s.label}
                </p>
                <p className="mt-0.5 text-sm text-on-surface-variant">{s.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Panel ── */}
        <section className="bg-surface-container-lowest py-20 sm:py-28">
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-2">
            <div className="reveal">
              <SectionLabel>Tu panel</SectionLabel>
              <h2 className="mt-4 font-[family-name:var(--font-heading)] text-3xl font-extrabold leading-tight tracking-tight text-balance sm:text-4xl">
                Ves cada pedido apenas entra, con todo lo que necesitás para prepararlo
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-on-surface-variant text-pretty">
                Nada de capturas de pantalla ni de mensajes sueltos. El pedido llega completo, con la
                dirección y la forma de pago, y vos solo lo movés de estado.
              </p>

              <ul className="mt-8 space-y-5">
                {PANEL_POINTS.map(([icon, title, text]) => (
                  <li key={title} className="flex gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <MaterialIcon name={icon} size="sm" />
                    </span>
                    <span>
                      <span className="block font-[family-name:var(--font-heading)] font-bold">
                        {title}
                      </span>
                      <span className="block text-on-surface-variant">{text}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="reveal">
              <PanelMock />
            </div>
          </div>
        </section>

        {/* ── Prueba social real ── */}
        <section className="landing-dark relative overflow-hidden border-y border-white/10">
          <div aria-hidden className="noise-overlay pointer-events-none absolute inset-0 opacity-[0.05]" />
          <div className="relative mx-auto max-w-7xl px-5 py-10 sm:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="lg:max-w-xs">
                <p className="font-[family-name:var(--font-heading)] text-lg font-extrabold text-white">
                  Menús publicados, funcionando hoy
                </p>
                <p className="mt-1 text-sm text-white/70">
                  Locales reales en Argentina, Uruguay y Colombia. Abrilos y mirá cómo queda el tuyo.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 lg:flex-1">
                {LIVE_STORES.map((s) => (
                  <a
                    key={s.slug}
                    href={`/${s.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-white/[0.08]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-primary-fixed-dim">
                      <MaterialIcon name="storefront" size="sm" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-white">{s.name}</span>
                      <span className="block truncate text-xs text-white/60">{s.place}</span>
                    </span>
                    <MaterialIcon
                      name="arrow_outward"
                      size="xs"
                      className="text-white/40 transition-colors group-hover:text-primary-fixed-dim"
                    />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Cómo funciona ── */}
        <section id="como-funciona" className="bg-surface-container-lowest py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="reveal mx-auto max-w-3xl text-center">
              <SectionLabel>Cómo funciona</SectionLabel>
              <h2 className="mt-4 font-[family-name:var(--font-heading)] text-3xl font-extrabold leading-tight tracking-tight text-balance sm:text-5xl">
                Tu menú digital gratis, en tres pasos
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-on-surface-variant text-pretty">
                Sin instalar nada y sin saber de tecnología. Si sabés sacar una foto, ya sabés hacerlo.
              </p>
            </div>

            <div className="relative mt-14">
              <div
                aria-hidden
                className="absolute left-[16%] right-[16%] top-10 hidden border-t-2 border-dashed border-outline-variant/60 md:block"
              />
              <div className="relative grid gap-6 md:grid-cols-3 md:gap-8">
                {STEPS.map((s, i) => (
                  <div
                    key={s.title}
                    className="reveal group relative rounded-3xl border border-outline-variant/50 bg-surface-container-low p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:bg-surface-container-lowest hover:shadow-ambient-lg"
                  >
                    <div className="flex items-start justify-between">
                      <span className="gradient-cta flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-lg shadow-primary/25">
                        <MaterialIcon name={s.icon} size="xl" />
                      </span>
                      <span className="font-[family-name:var(--font-heading)] text-6xl font-extrabold leading-none text-primary/10 transition-colors group-hover:text-primary/20">
                        {i + 1}
                      </span>
                    </div>
                    <h3 className="mt-5 font-[family-name:var(--font-heading)] text-xl font-extrabold sm:text-2xl">
                      {s.title}
                    </h3>
                    <p className="mt-2.5 leading-relaxed text-on-surface-variant">{s.text}</p>
                    <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-outline-variant/60 bg-surface-container-lowest px-3 py-1.5 text-xs font-bold text-on-surface-variant">
                      <MaterialIcon name="check" size="xs" className="text-success" />
                      {s.chip}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Seguimiento ── */}
        <section className="bg-surface-container-low py-20 sm:py-28">
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-[0.85fr_1fr]">
            <div className="reveal order-last lg:order-first">
              <WhatsAppMock />
            </div>
            <div className="reveal order-first lg:order-last">
              <SectionLabel>El detalle que te ahorra llamados</SectionLabel>
              <h2 className="mt-4 font-[family-name:var(--font-heading)] text-3xl font-extrabold leading-tight tracking-tight text-balance sm:text-4xl">
                Tus clientes dejan de llamar para preguntar dónde está el pedido
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-on-surface-variant text-pretty">
                Al confirmar, tu cliente recibe un link de seguimiento en vivo. Ve si está en
                preparación, si ya salió o si lo puede venir a buscar. Vos cambiás el estado una vez y
                el teléfono del local deja de sonar.
              </p>

              <ul className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  ['link', 'Un link por pedido', 'Sin apps, sin registro, en cualquier celular.'],
                  ['sync', 'Se actualiza solo', 'Cambiás el estado y el cliente lo ve al instante.'],
                  ['chat', 'Confirmación por WhatsApp', 'Con un toque arma el mensaje y te lo manda.'],
                  ['receipt', 'Comprobante de transferencia', 'Lo sube ahí mismo y vos lo ves en el pedido.'],
                ].map(([icon, t, d]) => (
                  <li
                    key={t}
                    className="rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-4"
                  >
                    <MaterialIcon name={icon} size="md" className="text-primary" />
                    <p className="mt-2 font-[family-name:var(--font-heading)] font-bold">{t}</p>
                    <p className="mt-1 text-sm text-on-surface-variant">{d}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── Funciones (bento) ── */}
        <section id="funciones" className="bg-surface-container-lowest py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="reveal mx-auto max-w-3xl text-center">
              <SectionLabel>Funciones</SectionLabel>
              <h2 className="mt-4 font-[family-name:var(--font-heading)] text-3xl font-extrabold leading-tight tracking-tight text-balance sm:text-5xl">
                Todo lo que necesitás para vender sin intermediarios
              </h2>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {BENTO_FEATURES.map((f) => {
                const Visual = f.visual;
                return (
                  <div
                    key={f.title}
                    className={`reveal relative rounded-3xl border border-outline-variant/50 bg-surface-container-low p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:bg-surface-container-lowest hover:shadow-ambient-lg ${f.span}`}
                  >
                    {'pro' in f && f.pro && (
                      <span className="absolute right-4 top-4 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-primary">
                        PRO
                      </span>
                    )}
                    <h3 className="max-w-sm font-[family-name:var(--font-heading)] text-lg font-extrabold">
                      {f.title}
                    </h3>
                    <p className="mt-1.5 max-w-md leading-relaxed text-on-surface-variant">{f.text}</p>
                    <Visual />
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Para quién es ── */}
        <section className="bg-surface-container-low py-20 sm:py-24">
          <div className="mx-auto max-w-5xl px-5 text-center sm:px-8">
            <div className="reveal">
              <SectionLabel>Para quién es</SectionLabel>
              <h2 className="mt-4 font-[family-name:var(--font-heading)] text-3xl font-extrabold leading-tight tracking-tight text-balance sm:text-4xl">
                Hecho para locales como el tuyo
              </h2>
              <p className="mt-4 text-lg text-on-surface-variant text-pretty">
                Pizzerías, hamburgueserías, rotiserías, cafeterías, heladerías, panaderías, bares. Da
                igual si recién arrancás o si ya vendés todos los días: si tomás pedidos, esto te los
                ordena.
              </p>
            </div>

            <div className="reveal mt-10 grid gap-4 text-left sm:grid-cols-3">
              {SITUATIONS.map((s) => (
                <div
                  key={s.title}
                  className="rounded-3xl border border-outline-variant/50 bg-surface-container-lowest p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-ambient-lg"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <MaterialIcon name={s.icon} size="md" />
                  </span>
                  <p className="mt-4 font-[family-name:var(--font-heading)] font-extrabold">{s.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-on-surface-variant">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Precios ── */}
        <section id="precios" className="bg-surface-container-lowest py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="reveal mx-auto max-w-3xl text-center">
              <SectionLabel>Precios</SectionLabel>
              <h2 className="mt-4 font-[family-name:var(--font-heading)] text-3xl font-extrabold leading-tight tracking-tight text-balance sm:text-5xl">
                Un precio fijo, y ni un peso por pedido
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-on-surface-variant text-pretty">
                Empezás gratis y usás quiero.menu sin pagar nada. Cuando tu negocio arranque a recibir
                pedidos, recién ahí decidís si pasás a Pro.
              </p>
            </div>

            <div className="reveal mx-auto mt-12 grid max-w-4xl items-stretch gap-6 md:grid-cols-2">
              <div className="flex flex-col rounded-3xl border border-outline-variant/50 bg-surface-container-low p-7 shadow-ambient sm:p-8">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-[family-name:var(--font-heading)] text-2xl font-extrabold">
                      Gratis
                    </h3>
                    <p className="text-sm text-on-surface-variant">Para arrancar sin riesgo</p>
                  </div>
                  <span className="rounded-full bg-surface-container-lowest px-3 py-1 text-[11px] font-bold text-on-surface-variant">
                    SIN TARJETA
                  </span>
                </div>
                <p className="mt-6">
                  <span className="font-[family-name:var(--font-heading)] text-5xl font-extrabold">
                    $0
                  </span>
                  <span className="text-on-surface-variant"> / mes</span>
                </p>
                <ul className="mt-6 flex-1 space-y-3 text-sm">
                  {[
                    'Hasta 100 pedidos al mes',
                    'Menú digital con QR',
                    'Pedidos online directos',
                    'Confirmación por WhatsApp',
                    'Seguimiento en vivo del pedido',
                    'Efectivo y transferencia',
                    'Panel de pedidos y pantalla de cocina',
                    'Productos y categorías ilimitados',
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-3">
                      <MaterialIcon name="check" size="sm" className="mt-0.5 shrink-0 text-success" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className="mt-6 rounded-2xl border-2 border-primary py-3.5 text-center font-bold text-primary transition-colors hover:bg-primary/5"
                >
                  Empezar gratis
                </Link>
              </div>

              <div className="gradient-border-card relative flex flex-col overflow-visible rounded-3xl p-7 shadow-ambient-lg sm:p-8 lg:-my-3">
                <span className="gradient-cta absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3.5 py-1 text-[11px] font-bold text-white shadow-lg shadow-primary/30">
                  RECOMENDADO
                </span>
                <div>
                  <h3 className="font-[family-name:var(--font-heading)] text-2xl font-extrabold">Pro</h3>
                  <p className="text-sm text-on-surface-variant">Para el local que ya vende todos los días</p>
                </div>
                <p className="mt-6">
                  <span className="font-[family-name:var(--font-heading)] text-5xl font-extrabold">
                    $15.000
                  </span>
                  <span className="text-on-surface-variant"> / mes</span>
                </p>
                <ul className="mt-6 flex-1 space-y-3 text-sm">
                  <li className="flex items-start gap-3 font-bold text-on-surface">
                    <MaterialIcon name="check" size="sm" className="mt-0.5 shrink-0 text-success" />
                    <span>Todo lo del plan gratis</span>
                  </li>
                  {[
                    'Pedidos ilimitados',
                    'Sin marca de quiero.menu',
                    'Estadísticas y horas pico',
                    'Cupones y promociones',
                    'Tu propio dominio',
                    'Soporte prioritario',
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-3">
                      <MaterialIcon name="check" size="sm" className="mt-0.5 shrink-0 text-success" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className="btn-shimmer gradient-cta relative mt-6 overflow-hidden rounded-2xl py-3.5 text-center font-bold text-white transition-transform hover:scale-[1.02]"
                >
                  <span className="relative">Empezar con Pro</span>
                </Link>
              </div>
            </div>

            <p className="mt-8 text-center text-sm text-on-surface-variant">
              Sin costos ocultos, sin comisiones por pedido, sin permanencia.
            </p>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="bg-surface-container-low py-20 sm:py-28">
          <div className="mx-auto max-w-3xl px-5 sm:px-8">
            <div className="reveal text-center">
              <SectionLabel>Preguntas frecuentes</SectionLabel>
              <h2 className="mt-4 font-[family-name:var(--font-heading)] text-3xl font-extrabold tracking-tight sm:text-4xl">
                Lo que todos preguntan antes de empezar
              </h2>
            </div>

            <div className="mt-10 space-y-3">
              {faqs.map((faq) => (
                <details
                  key={faq.q}
                  className="group rounded-2xl border border-outline-variant/50 bg-surface-container-lowest px-5 py-4 transition-colors hover:border-primary/40 [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-4 font-[family-name:var(--font-heading)] font-bold">
                    {faq.q}
                    <MaterialIcon
                      name="expand_more"
                      className="shrink-0 text-primary transition-transform group-open:rotate-180"
                    />
                  </summary>
                  <p className="mt-3 leading-relaxed text-on-surface-variant">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA final ── */}
        <section className="px-5 py-20 sm:px-8 sm:py-24">
          <div className="landing-dark relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] px-6 py-16 text-center sm:px-14 sm:py-20">
            <div aria-hidden className="noise-overlay pointer-events-none absolute inset-0 opacity-[0.06]" />
            <div
              aria-hidden
              className="animate-orb pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-primary/25 blur-3xl"
            />
            <div className="relative">
              <h2 className="font-[family-name:var(--font-heading)] text-3xl font-extrabold leading-tight tracking-tight text-white text-balance sm:text-5xl">
                El próximo pedido, que te llegue armado
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/70 text-pretty">
                Tu menú digital gratis, listo en 5 minutos. Sin comisión por pedido, ni ahora ni nunca.
              </p>
              <PrimaryCta className="mt-9" />
              <div className="mt-7 flex justify-center">
                <Reassurance tone="dark" />
              </div>
            </div>
          </div>
        </section>

        {/* ── asis.chat ── */}
        <section className="px-5 pb-16 sm:px-8">
          <div className="mx-auto flex max-w-5xl flex-col items-start gap-4 rounded-3xl border border-outline-variant/50 bg-surface-container-lowest px-6 py-6 shadow-ambient sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-600/10 text-green-700">
                <MaterialIcon name="chat" size="md" />
              </span>
              <div>
                <p className="font-[family-name:var(--font-heading)] font-bold">
                  ¿Querés que tu WhatsApp responda solo?{' '}
                  <span className="rounded-full bg-surface-container-low px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">
                    Próximamente
                  </span>
                </p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Estamos conectando quiero.menu con asis.chat para contestar pedidos y volver a
                  escribirle a quien ya te compró.
                </p>
              </div>
            </div>
            <a
              href="https://asis.chat"
              target="_blank"
              rel="noopener noreferrer"
              className="flex shrink-0 items-center gap-1.5 text-sm font-bold text-primary hover:underline"
            >
              Conocer asis.chat
              <MaterialIcon name="open_in_new" size="xs" />
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-outline-variant/40 bg-surface-container-low">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Logo size="md" href="/" />
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-on-surface-variant">
                Menú digital y pedidos directos para locales de comida. Sin comisiones por pedido.
              </p>
            </div>
            <div>
              <p className="font-[family-name:var(--font-heading)] text-sm font-bold">Producto</p>
              <div className="mt-3 flex flex-col gap-2.5 text-sm text-on-surface-variant">
                <a className="hover:text-primary" href="#como-funciona">Cómo funciona</a>
                <a className="hover:text-primary" href="#funciones">Funciones</a>
                <a className="hover:text-primary" href="#precios">Precios</a>
              </div>
            </div>
            <div>
              <p className="font-[family-name:var(--font-heading)] text-sm font-bold">Empezar</p>
              <div className="mt-3 flex flex-col gap-2.5 text-sm text-on-surface-variant">
                <Link className="hover:text-primary" href="/signup">Crear mi menú gratis</Link>
                <Link className="hover:text-primary" href="/login">Entrar a mi panel</Link>
                <Link className="hover:text-primary" href="/status">Estado del servicio</Link>
              </div>
            </div>
            <div>
              <p className="font-[family-name:var(--font-heading)] text-sm font-bold">Menús de ejemplo</p>
              <div className="mt-3 flex flex-col gap-2.5 text-sm text-on-surface-variant">
                {LIVE_STORES.map((s) => (
                  <a
                    key={s.slug}
                    className="hover:text-primary"
                    href={`/${s.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {s.name}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-outline-variant/40 pt-6 sm:flex-row">
            <p className="text-sm text-on-surface-variant">
              &copy; 2026 quiero.menu. Todos los derechos reservados.
            </p>
            <div className="flex gap-6 text-sm text-on-surface-variant">
              <Link className="hover:text-primary" href="/terms">Términos</Link>
              <Link className="hover:text-primary" href="/privacy">Privacidad</Link>
            </div>
          </div>
        </div>
        <div className="h-24 lg:hidden" />
      </footer>
    </div>
  );
}
