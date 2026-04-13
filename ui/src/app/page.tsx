import Link from 'next/link';
import { MaterialIcon } from '@/components/ui/material-icon';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'quiero.menu | Tu menu digital sin comisiones',
  description: 'Mostra tu menu online y recibi pedidos directos por WhatsApp. Sin comisiones. Gratis.',
};

export default function LandingPage() {
  return (
    <div className="bg-surface text-on-surface">
      {/* TopAppBar */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 bg-glass border-b border-outline-variant/30">
        <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center">
            <span className="text-2xl font-extrabold text-on-surface tracking-tight font-[family-name:var(--font-heading)]">quiero</span>
            <span className="text-2xl font-extrabold text-primary tracking-tight font-[family-name:var(--font-heading)]">.menu</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a className="text-primary font-semibold font-[family-name:var(--font-heading)]" href="#inicio">Inicio</a>
            <a className="text-on-surface-variant font-medium hover:text-primary transition-colors font-[family-name:var(--font-heading)]" href="#funciones">Funciones</a>
            <a className="text-on-surface-variant font-medium hover:text-primary transition-colors font-[family-name:var(--font-heading)]" href="#precios">Precios</a>
          </div>
          <Link
            href="/signup"
            className="gradient-cta text-white px-6 py-2.5 rounded-lg font-bold hover:opacity-90 transition-all"
          >
            Empezar gratis
          </Link>
        </div>
      </nav>

      <main className="pt-24">
        {/* Hero Section */}
        <section id="inicio" className="px-6 py-16 md:py-24 max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight text-on-surface">
                Tu menu digital. <span className="text-primary">Pedidos directos.</span> Sin comisiones.
              </h1>
              <p className="text-xl text-on-surface-variant max-w-lg leading-relaxed">
                Mostra tu menu online y recibi pedidos directos. Sin pagar 30% de comision a nadie. Comparti tu link por WhatsApp, redes sociales o con un QR en tu local.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/signup"
                  className="gradient-cta text-white px-8 py-4 rounded-lg font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform text-center"
                >
                  Crear mi menu gratis
                </Link>
                <a
                  href="#demo"
                  className="bg-white text-primary border border-primary/20 px-8 py-4 rounded-lg font-bold text-lg hover:bg-surface-container-low transition-colors text-center"
                >
                  Ver demo en vivo
                </a>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-primary/5 rounded-full blur-3xl" />
              {/* Smartphone Mockup */}
              <div className="relative mx-auto w-[280px] md:w-[320px] aspect-[9/19.5] bg-black rounded-[3rem] border-[8px] border-stone-800 shadow-2xl overflow-hidden">
                <div className="absolute top-0 w-full h-6 bg-black flex justify-center pt-1">
                  <div className="w-20 h-4 bg-stone-900 rounded-full" />
                </div>
                <div className="h-full w-full bg-white pt-8 px-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-lg text-on-surface">Pizzeria Napoli</h4>
                    <MaterialIcon name="shopping_bag" className="text-primary" />
                  </div>
                  <img
                    alt="Pizzeria"
                    className="w-full h-32 object-cover rounded-xl mb-4"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCLBC89WbgjxI3A9hWf296UcipvrpO80HZfyBLeINShHNQy_q56JDOIer_ZV6SxmBXbArmWLztNKBwTPo8iQUuB7ehNU_pIvNwQPyCJSpHABgIxJOAkvnSEij5wDexlNCgUwMSOrNUujnzmMj2GLRSU3Ye_YNDE_3aoZU1dOa4B5ph2Nmnxhty_MUvXP3NShU6fqhgOxgDy1VtsFHf_-MBas5hJI6OGgz3X91hc6eY1xRGiXqGllUkDaPjCtGSSrm6H1bgDErzIgzY"
                  />
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 border-b border-gray-100">
                      <div>
                        <p className="font-bold text-sm text-on-surface">Pizza Margherita</p>
                        <p className="text-xs text-on-surface-variant">Tomate, mozzarella y albahaca.</p>
                      </div>
                      <p className="font-bold text-primary text-sm">$48.000</p>
                    </div>
                    <div className="flex justify-between items-center p-3 border-b border-gray-100">
                      <div>
                        <p className="font-bold text-sm text-on-surface">Pizza Pepperoni</p>
                        <p className="text-xs text-on-surface-variant">Mucho pepperoni y queso.</p>
                      </div>
                      <p className="font-bold text-primary text-sm">$55.000</p>
                    </div>
                  </div>
                  <div className="absolute bottom-6 left-4 right-4">
                    <button className="w-full gradient-cta text-white py-3 rounded-full font-bold text-sm">Ver mi pedido</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Competitive Comparison */}
        <section className="bg-white py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Basta de repartir tus ganancias</h2>
              <p className="text-on-surface-variant text-lg">Compara y elegi la mejor opcion para tu negocio.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-surface p-8 rounded-2xl border border-outline-variant/30">
                <div className="flex items-center gap-3 mb-6 text-on-surface-variant font-bold">
                  <MaterialIcon name="cancel" />
                  Apps de Delivery
                </div>
                <ul className="space-y-4 text-on-surface-variant">
                  <li className="flex items-start gap-3">
                    <MaterialIcon name="remove" size="sm" className="text-error mt-1" />
                    <span>Hasta 30% de comision por cada pedido.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <MaterialIcon name="remove" size="sm" className="text-error mt-1" />
                    <span>Tus clientes son de la app, no tuyos.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <MaterialIcon name="remove" size="sm" className="text-error mt-1" />
                    <span>Cobras hasta 15 dias despues.</span>
                  </li>
                </ul>
              </div>
              <div className="bg-primary/5 p-8 rounded-2xl border-2 border-primary relative overflow-hidden">
                <div className="absolute top-4 right-4 gradient-cta text-white text-[10px] font-bold px-2 py-1 rounded">MEJOR OPCION</div>
                <div className="flex items-center gap-3 mb-6 text-primary font-bold">
                  <MaterialIcon name="check_circle" />
                  quiero.menu
                </div>
                <ul className="space-y-4 text-on-surface">
                  <li className="flex items-start gap-3">
                    <MaterialIcon name="add" size="sm" className="text-primary mt-1" />
                    <span>0% de comision por pedido.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <MaterialIcon name="add" size="sm" className="text-primary mt-1" />
                    <span>Tus clientes te contactan directo.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <MaterialIcon name="add" size="sm" className="text-primary mt-1" />
                    <span>Cobras al momento, como quieras.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Process */}
        <section className="py-24 px-6 max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">Empezar es asi de simple</h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <MaterialIcon name="upload_file" size="xl" className="text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">1. Subi tu menu</h3>
              <p className="text-on-surface-variant">Carga tus productos, precios y fotos en minutos. Si tenes el menu en una imagen, lo autocompletamos con IA.</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <MaterialIcon name="share" size="xl" className="text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">2. Comparti tu link</h3>
              <p className="text-on-surface-variant">Ponelo en tu bio de Instagram, en estados de WhatsApp, o pega un QR en tus mesas.</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <MaterialIcon name="dashboard_customize" size="xl" className="text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">3. Recibi los pedidos en tu panel</h3>
              <p className="text-on-surface-variant">Tus pedidos llegan organizados y listos para preparar. Tambien podes derivarlos a tu WhatsApp si queres.</p>
            </div>
          </div>
        </section>

        {/* Casos de Uso */}
        <section className="bg-surface-container-low py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-16">Disenado para cada tipo de negocio</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-2xl text-center shadow-ambient hover:shadow-ambient-lg transition-shadow">
                <MaterialIcon name="local_pizza" size="xl" className="text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Pizzeria</h3>
                <p className="text-on-surface-variant">Gestiona variantes de sabores y tamanos sin errores en la comanda.</p>
              </div>
              <div className="bg-white p-8 rounded-2xl text-center shadow-ambient hover:shadow-ambient-lg transition-shadow">
                <MaterialIcon name="restaurant" size="xl" className="text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Rotiseria</h3>
                <p className="text-on-surface-variant">Actualiza tu plato del dia en segundos y avisa a tus clientes recurrentes.</p>
              </div>
              <div className="bg-white p-8 rounded-2xl text-center shadow-ambient hover:shadow-ambient-lg transition-shadow">
                <MaterialIcon name="lunch_dining" size="xl" className="text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Hamburgueseria</h3>
                <p className="text-on-surface-variant">Anadi extras y complementos facilmente para aumentar tu ticket promedio.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Key Features (Bento Grid) */}
        <section id="funciones" className="py-24 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Todo el control en tu mano</h2>
            <p className="text-on-surface-variant">Herramientas profesionales para que tu cocina no se detenga.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            {/* Dashboard */}
            <div className="md:col-span-3 bg-white rounded-2xl p-8 flex flex-col justify-between overflow-hidden relative min-h-[320px] border border-outline-variant/30">
              <div>
                <h3 className="text-2xl font-bold mb-2">Dashboard de metricas</h3>
                <p className="text-on-surface-variant">Conoce tus platos mas vendidos y las horas pico de tu negocio.</p>
              </div>
              <div className="mt-8 bg-surface p-4 rounded-xl border border-outline-variant/20">
                <div className="flex items-end gap-2 h-32">
                  <div className="flex-1 bg-primary/20 h-[40%] rounded-t-lg" />
                  <div className="flex-1 bg-primary/40 h-[70%] rounded-t-lg" />
                  <div className="flex-1 bg-primary/10 h-[50%] rounded-t-lg" />
                  <div className="flex-1 bg-primary h-[90%] rounded-t-lg" />
                  <div className="flex-1 bg-primary/30 h-[60%] rounded-t-lg" />
                </div>
              </div>
            </div>
            {/* Menu Editor */}
            <div className="md:col-span-3 gradient-cta text-white rounded-2xl p-8 flex flex-col justify-between min-h-[320px]">
              <div>
                <h3 className="text-2xl font-bold mb-2">Editor de menu</h3>
                <p className="text-white/80">Cambia precios o pausa platos sin stock en tiempo real desde tu celular.</p>
              </div>
              <div className="mt-8 bg-white/20 p-6 rounded-xl space-y-3">
                <div className="flex justify-between items-center bg-white/10 p-2 rounded">
                  <div className="flex gap-2 items-center">
                    <div className="w-8 h-8 bg-white/30 rounded" />
                    <span className="font-medium">Burger Clasica</span>
                  </div>
                  <span className="font-bold">$12.500</span>
                </div>
                <div className="flex justify-between items-center bg-white/10 p-2 rounded">
                  <div className="flex gap-2 items-center">
                    <div className="w-8 h-8 bg-white/30 rounded" />
                    <span className="font-medium">Pizza Especial</span>
                  </div>
                  <span className="font-bold">$18.000</span>
                </div>
              </div>
            </div>
            {/* Kitchen Board */}
            <div className="md:col-span-6 bg-white rounded-2xl p-8 flex flex-col md:flex-row gap-8 items-center border border-outline-variant/30">
              <div className="md:w-1/2">
                <h3 className="text-2xl font-bold mb-2">Kitchen Board</h3>
                <p className="text-on-surface-variant">Gestiona el estado de los pedidos de forma visual y organizada para que nada se te pase.</p>
                <div className="mt-6 flex gap-4">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">En Preparacion</span>
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-bold">Para Retirar</span>
                </div>
              </div>
              <div className="md:w-1/2 w-full grid grid-cols-2 gap-4">
                <div className="bg-surface p-4 rounded-xl shadow-ambient border border-outline-variant/20">
                  <p className="text-xs font-bold text-on-surface-variant mb-1">PEDIDO #429</p>
                  <p className="text-sm font-bold">2x Burger XL</p>
                  <p className="text-xs text-primary">Hace 4 min</p>
                </div>
                <div className="bg-surface p-4 rounded-xl shadow-ambient border border-outline-variant/20">
                  <p className="text-xs font-bold text-on-surface-variant mb-1">PEDIDO #430</p>
                  <p className="text-sm font-bold">1x Pizza Veggie</p>
                  <p className="text-xs text-primary">Hace 1 min</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 px-6 bg-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Preguntas frecuentes</h2>
            <div className="space-y-4">
              {[
                {
                  q: 'Como reciben mis clientes el menu?',
                  a: 'Tus clientes acceden mediante un enlace directo o escaneando un codigo QR en tu local, sin necesidad de descargar ninguna aplicacion.',
                },
                {
                  q: 'Cuanto tardo en configurar todo?',
                  a: 'Podes tener tu menu listo en menos de 10 minutos. Nuestra herramienta de IA te ayuda a cargar tus platos si ya tenes una foto de tu menu fisico.',
                },
                {
                  q: 'Puedo cobrar online con Mercado Pago?',
                  a: 'Si, podes integrar Mercado Pago para recibir pagos con tarjeta o transferencia, o simplemente recibir el pedido y cobrar al entregar.',
                },
                {
                  q: 'Como me entero de un pedido nuevo?',
                  a: 'Recibis una notificacion sonora en tu panel de control y, opcionalmente, el pedido armado directamente en tu WhatsApp.',
                },
                {
                  q: 'Hay limite de productos o categorias?',
                  a: 'No, podes cargar todos los productos y categorias que necesites para organizar tu carta de la mejor manera.',
                },
                {
                  q: 'Que pasa si me quedo sin stock de algo?',
                  a: 'Podes pausar cualquier producto en tiempo real desde tu celular y dejara de aparecer como disponible para tus clientes de inmediato.',
                },
              ].map((faq) => (
                <details key={faq.q} className="group bg-surface rounded-xl p-6 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex justify-between items-center cursor-pointer font-bold text-lg">
                    {faq.q}
                    <MaterialIcon name="expand_more" className="transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-4 text-on-surface-variant">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section id="precios" className="py-24 px-6">
          <div className="max-w-4xl mx-auto bg-inverse-surface text-inverse-on-surface rounded-[2.5rem] p-12 md:p-20 text-center relative overflow-hidden">
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-primary/20 rounded-full blur-[100px]" />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-extrabold mb-6">Empeza a vender directo, sin intermediarios</h2>
              <p className="text-xl text-inverse-on-surface/70 mb-10 max-w-2xl mx-auto">Crea tu menu digital en 5 minutos. Gratis hasta 50 pedidos al mes.</p>
              <Link
                href="/signup"
                className="inline-block gradient-cta text-white px-10 py-5 rounded-xl font-bold text-xl hover:scale-105 transition-transform"
              >
                Crear mi menu gratis
              </Link>
              <p className="mt-8 text-sm text-inverse-on-surface/50">Sin tarjeta de credito. Sin compromiso.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white py-16 border-t border-outline-variant/30">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col gap-2 items-center md:items-start">
            <div className="flex items-center">
              <span className="text-xl font-extrabold text-on-surface tracking-tight font-[family-name:var(--font-heading)]">quiero</span>
              <span className="text-xl font-extrabold text-primary tracking-tight font-[family-name:var(--font-heading)]">.menu</span>
            </div>
            <p className="text-sm text-on-surface-variant">&copy; 2026 quiero.menu. Todos los derechos reservados.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
            <a className="text-sm text-on-surface-variant hover:text-primary transition-colors" href="#funciones">Funciones</a>
            <a className="text-sm text-on-surface-variant hover:text-primary transition-colors" href="#precios">Precios</a>
            <Link className="text-sm text-on-surface-variant hover:text-primary transition-colors" href="/dashboard">Panel</Link>
            <a className="text-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Soporte</a>
            <a className="text-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Privacidad</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
