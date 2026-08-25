import { MaterialIcon } from '@/components/ui/material-icon';

const ORDERS = [
  {
    id: '#1042',
    when: 'hace 1 min',
    customer: 'Sofía R.',
    items: ['2× Pizza Margherita', '1× Gaseosa 1.5 L'],
    total: '$28.200',
    type: 'Delivery',
    state: 'nuevo' as const,
  },
  {
    id: '#1041',
    when: 'hace 6 min',
    customer: 'Martín G.',
    items: ['1× Pizza Pollo BBQ', '1× Doble Cheddar'],
    total: '$27.800',
    type: 'Retiro',
    state: 'preparacion' as const,
  },
  {
    id: '#1040',
    when: 'hace 14 min',
    customer: 'Carla V.',
    items: ['3× Pizza Pepperoni'],
    total: '$44.700',
    type: 'Delivery',
    state: 'listo' as const,
  },
];

const STATE_STYLES = {
  nuevo: 'bg-primary/10 text-primary border-primary/30',
  preparacion: 'bg-amber-100 text-amber-800 border-amber-300/60',
  listo: 'bg-success-container text-on-success-container border-success/30',
};

const STATE_LABEL = {
  nuevo: 'Nuevo',
  preparacion: 'En preparación',
  listo: 'Listo',
};

export function PanelMock() {
  return (
    <div className="overflow-hidden rounded-3xl border border-outline-variant/50 bg-surface-container-lowest shadow-ambient-lg">
      <div className="flex items-center gap-3 border-b border-outline-variant/40 bg-surface-container-low px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-outline-variant" />
          <span className="h-2.5 w-2.5 rounded-full bg-outline-variant" />
          <span className="h-2.5 w-2.5 rounded-full bg-outline-variant" />
        </div>
        <div className="flex flex-1 items-center gap-1.5 rounded-lg bg-surface-container-lowest px-3 py-1.5 text-xs text-on-surface-variant">
          <MaterialIcon name="lock" size="xs" className="text-success" />
          quiero.menu/orders
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-[family-name:var(--font-heading)] text-lg font-extrabold text-on-surface">
              Pedidos de hoy
            </p>
            <p className="text-xs text-on-surface-variant">Pizzería Napoli · Villa Crespo</p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full border border-success/30 bg-success-container px-3 py-1 text-xs font-bold text-on-success-container">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping-soft absolute inline-flex h-full w-full rounded-full bg-success" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            En vivo
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
          {[
            ['Pedidos', '14'],
            ['Vendido', '$186.400'],
            ['Ticket', '$13.314'],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-outline-variant/40 bg-surface px-3 py-2.5"
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                {label}
              </p>
              <p className="font-[family-name:var(--font-heading)] text-base font-extrabold text-on-surface sm:text-lg">
                {value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-2.5">
          {ORDERS.map((o) => (
            <div
              key={o.id}
              className="rounded-2xl border border-outline-variant/40 bg-surface p-3.5 sm:p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-[family-name:var(--font-heading)] text-sm font-extrabold text-on-surface">
                      {o.id}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATE_STYLES[o.state]}`}
                    >
                      {STATE_LABEL[o.state]}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-on-surface-variant">
                      <MaterialIcon
                        name={o.type === 'Delivery' ? 'delivery_dining' : 'store'}
                        size="xs"
                      />
                      {o.type}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-on-surface-variant">
                    {o.customer} · {o.items.join(' · ')}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-[family-name:var(--font-heading)] text-sm font-extrabold text-on-surface">
                    {o.total}
                  </p>
                  <p className="text-[11px] text-on-surface-variant">{o.when}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
