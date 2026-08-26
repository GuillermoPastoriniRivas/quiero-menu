import Link from 'next/link';
import type { Metadata } from 'next';
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
];

const FEATURES = [
  {
    icon: 'palette',
    title: 'Tu local, con tu cara',
    text: 'Colores, logo, portada y descripción. No parece una plantilla más: parece tuyo.',
  },
  {
    icon: 'local_offer',
    title: 'Cupones para llenar los días flojos',
    text: 'Armás un descuento para el martes a la noche y lo compartís por WhatsApp.',
  },
  {
    icon: 'print',
    title: 'QR listo para imprimir',
    text: 'Hoja A4 con tu QR, tu contacto y las instrucciones. La imprimís y la pegás en la mesa.',
  },
  {
    icon: 'language',
    title: 'Tu propio dominio',
    text: 'tulocal.com apuntando a tu menú, con certificado incluido.',
    pro: true,
  },
  {
    icon: 'groups',
    title: 'Tus clientes son tuyos',
    text: 'Quién te compró, qué pidió y cuánto gastó. Ninguna app se queda con esa lista.',
  },
  {
    icon: 'payments',
    title: 'Cobrás como cobrás hoy',
    text: 'Efectivo o transferencia. Le mostrás tus datos bancarios y sube el comprobante ahí mismo.',
  },
];

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

const BUSINESSES = [
  ['local_pizza', 'Pizzerías'],
  ['lunch_dining', 'Hamburgueserías'],
  ['restaurant', 'Rotiserías'],
  ['local_cafe', 'Cafeterías'],
  ['icecream', 'Heladerías'],
  ['bakery_dining', 'Panaderías'],
  ['ramen_dining', 'Sushi y delivery'],
  ['local_bar', 'Bares'],
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
    <div className="bg-surface text-on-surface">
      <CookielessAnalytics />
      <JsonLd data={webSiteJsonLd} />
      <JsonLd data={softwareApplicationJsonLd} />
      <JsonLd data={faqJsonLd} />

      <LandingNav />
      <StickyCta />

      <main className="pt-16">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div aria-hidden className="landing-aurora absolute inset-0 -z-10" />
          <div aria-hidden className="landing-dots absolute inset-0 -z-10" />

          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-10 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:pb-24 lg:pt-16">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-success/25 bg-success-container px-3.5 py-1.5 text-xs font-bold text-on-success-container">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping-soft absolute inline-flex h-full w-full rounded-full bg-success" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                </span>
                Gratis hasta 100 pedidos por mes · sin tarjeta
              </span>

              <h1 className="mt-6 font-[family-name:var(--font-heading)] text-[2.6rem] font-extrabold leading-[0.98] tracking-[-0.035em] text-balance sm:text-6xl lg:text-[4.25rem]">
                Pedidos directos.{' '}
                <span className="text-gradient-brand">Sin comisiones.</span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-on-surface-variant text-pretty sm:text-xl">
                Armá tu <strong className="font-semibold text-on-surface">menú digital gratis</strong> y
                compartilo por WhatsApp o con un QR. El pedido te llega listo, con dirección, forma de
                pago y total. Sin comisión, nunca.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/onboarding"
                  className="gradient-cta group flex items-center justify-center gap-2 rounded-2xl px-7 py-4 text-lg font-bold text-white shadow-xl shadow-primary/25 transition-transform hover:scale-[1.02]"
                >
                  Crear mi menú gratis
                  <MaterialIcon
                    name="arrow_forward"
                    size="sm"
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
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

              <div className="mt-6">
                <Reassurance />
              </div>
            </div>

            <div className="lg:pl-6">
              <MenuDemo />
            </div>
          </div>

          <div aria-hidden className="landing-hairline mx-auto h-px max-w-5xl" />
        </section>

        {/* Panel */}
        <section className="bg-surface-container-low py-20 sm:py-28">
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

        {/* Prueba social real */}
        <section className="landing-dark relative overflow-hidden border-b border-white/10">
          <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
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
                    className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition-colors hover:border-primary/50"
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

        {/* Cómo funciona */}
        <section id="como-funciona" className="bg-surface-container-low py-20 sm:py-28">
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
                className="absolute left-0 right-0 top-9 hidden border-t-2 border-dashed border-outline-variant/60 md:block"
              />
              <div className="relative grid gap-10 md:grid-cols-3 md:gap-8">
                {STEPS.map((s, i) => (
                  <div key={s.title} className="reveal text-center md:text-left">
                    <div className="flex justify-center md:justify-start">
                      <div className="gradient-cta flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-3xl text-white shadow-lg shadow-primary/25 ring-8 ring-surface-container-lowest">
                        <MaterialIcon name={s.icon} size="xl" />
                      </div>
                    </div>
                    <p className="mt-5 font-[family-name:var(--font-heading)] text-sm font-bold uppercase tracking-wider text-primary">
                      Paso {i + 1}
                    </p>
                    <h3 className="mt-1.5 font-[family-name:var(--font-heading)] text-xl font-extrabold sm:text-2xl">
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

        {/* Seguimiento */}
        <section className="bg-surface-container-lowest py-20 sm:py-28">
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1fr_0.85fr]">
            <div className="reveal">
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
                    className="rounded-2xl border border-outline-variant/50 bg-surface p-4"
                  >
                    <MaterialIcon name={icon} size="md" className="text-primary" />
                    <p className="mt-2 font-[family-name:var(--font-heading)] font-bold">{t}</p>
                    <p className="mt-1 text-sm text-on-surface-variant">{d}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="reveal">
              <WhatsAppMock />
            </div>
          </div>
        </section>

        {/* Funciones */}
        <section id="funciones" className="bg-surface-container-low py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="reveal mx-auto max-w-3xl text-center">
              <SectionLabel>Funciones</SectionLabel>
              <h2 className="mt-4 font-[family-name:var(--font-heading)] text-3xl font-extrabold leading-tight tracking-tight text-balance sm:text-5xl">
                Todo lo que necesitás para vender sin intermediarios
              </h2>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="reveal group relative rounded-3xl border border-outline-variant/50 bg-surface-container-lowest p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-ambient-lg"
                >
                  {f.pro && (
                    <span className="absolute right-4 top-4 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-primary">
                      PRO
                    </span>
                  )}
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <MaterialIcon name={f.icon} size="lg" />
                  </span>
                  <h3 className="mt-4 font-[family-name:var(--font-heading)] text-lg font-extrabold">
                    {f.title}
                  </h3>
                  <p className="mt-2 leading-relaxed text-on-surface-variant">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Para quién */}
        <section className="bg-surface-container-lowest py-20 sm:py-24">
          <div className="mx-auto max-w-5xl px-5 text-center sm:px-8">
            <div className="reveal">
              <SectionLabel>Para quién es</SectionLabel>
              <h2 className="mt-4 font-[family-name:var(--font-heading)] text-3xl font-extrabold leading-tight tracking-tight text-balance sm:text-4xl">
                Hecho para locales como el tuyo
              </h2>
              <p className="mt-4 text-lg text-on-surface-variant">
                Da igual si recién arrancás o si ya vendés todos los días. Si tomás pedidos, esto te los
                ordena.
              </p>
            </div>

            <div className="reveal mt-10 grid gap-4 text-left sm:grid-cols-3">
              {SITUATIONS.map((s) => (
                <div
                  key={s.title}
                  className="rounded-3xl border border-outline-variant/50 bg-surface p-6"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <MaterialIcon name={s.icon} size="md" />
                  </span>
                  <p className="mt-4 font-[family-name:var(--font-heading)] font-extrabold">{s.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-on-surface-variant">{s.text}</p>
                </div>
              ))}
            </div>

            <div className="reveal mt-8 flex flex-wrap justify-center gap-3">
              {BUSINESSES.map(([icon, label]) => (
                <span
                  key={label}
                  className="flex items-center gap-2 rounded-2xl border border-outline-variant/50 bg-surface px-4 py-3 text-sm font-bold text-on-surface"
                >
                  <MaterialIcon name={icon} size="sm" className="text-primary" />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Precios */}
        <section id="precios" className="bg-surface-container-low py-20 sm:py-28">
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
              <div className="flex flex-col rounded-3xl border border-outline-variant/50 bg-surface-container-lowest p-7 shadow-ambient sm:p-8">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-[family-name:var(--font-heading)] text-2xl font-extrabold">
                      Gratis
                    </h3>
                    <p className="text-sm text-on-surface-variant">Para arrancar sin riesgo</p>
                  </div>
                  <span className="rounded-full bg-surface px-3 py-1 text-[11px] font-bold text-on-surface-variant">
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
                <p className="mt-5 flex items-start gap-1.5 text-xs text-on-surface-variant">
                  <MaterialIcon name="info" size="xs" className="mt-0.5 shrink-0" />
                  Tu menú lleva la marca &ldquo;Hecho con quiero.menu&rdquo;.
                </p>
                <Link
                  href="/onboarding"
                  className="mt-6 rounded-2xl border-2 border-primary py-3.5 text-center font-bold text-primary transition-colors hover:bg-primary/5"
                >
                  Empezar gratis
                </Link>
              </div>

              <div className="relative flex flex-col overflow-hidden rounded-3xl border-2 border-primary bg-surface-container-lowest p-7 shadow-ambient-lg sm:p-8">
                <span className="gradient-cta absolute right-5 top-5 rounded-full px-2.5 py-1 text-[10px] font-bold text-white">
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
                  {[
                    'Pedidos ilimitados',
                    'Todo lo del plan gratis',
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
                <p className="mt-5 rounded-2xl bg-success-container p-3.5 text-xs font-semibold leading-relaxed text-on-success-container">
                  Pro sale lo mismo que un pedido promedio. Todo lo demás que vendas en el mes queda
                  entero para vos, sin comisión por pedido.
                </p>
                <Link
                  href="/onboarding"
                  className="gradient-cta mt-6 rounded-2xl py-3.5 text-center font-bold text-white transition-transform hover:scale-[1.02]"
                >
                  Empezar con Pro
                </Link>
              </div>
            </div>

            <p className="mt-8 text-center text-sm text-on-surface-variant">
              Sin costos ocultos, sin comisiones por pedido, sin permanencia.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-surface-container-lowest py-20 sm:py-28">
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
                  className="group rounded-2xl border border-outline-variant/50 bg-surface px-5 py-4 transition-colors hover:border-primary/40 [&_summary::-webkit-details-marker]:hidden"
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

        {/* CTA final */}
        <section className="px-5 py-20 sm:px-8 sm:py-24">
          <div className="landing-dark relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] px-6 py-16 text-center sm:px-14 sm:py-20">
            <h2 className="font-[family-name:var(--font-heading)] text-3xl font-extrabold leading-tight tracking-tight text-white text-balance sm:text-5xl">
              El próximo pedido, que te llegue armado
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/70 text-pretty">
              Tu menú digital gratis, listo en 5 minutos. Sin comisión por pedido, ni ahora ni nunca.
            </p>
            <Link
              href="/onboarding"
              className="gradient-cta mt-9 inline-flex items-center gap-2 rounded-2xl px-9 py-5 text-lg font-bold text-white transition-transform hover:scale-105 sm:text-xl"
            >
              Crear mi menú gratis
              <MaterialIcon name="arrow_forward" size="md" />
            </Link>
            <div className="mt-7 flex justify-center">
              <Reassurance tone="dark" />
            </div>
          </div>
        </section>

        {/* asis.chat */}
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
                <Link className="hover:text-primary" href="/onboarding">Crear mi menú gratis</Link>
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
