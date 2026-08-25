'use client';

import Link from 'next/link';
import { useState } from 'react';
import { MaterialIcon } from '@/components/ui/material-icon';
import { formatARS } from '@/lib/format';
import { cn } from '@/lib/utils';

const WEEKS_PER_MONTH = 4.33;
const PRO_MONTHLY = 15000;
const RATES = [20, 25, 30];

export function CommissionCalculator() {
  const [ordersPerWeek, setOrdersPerWeek] = useState(45);
  const [ticket, setTicket] = useState(14000);
  const [rate, setRate] = useState(25);

  const ordersPerMonth = Math.round(ordersPerWeek * WEEKS_PER_MONTH);
  const revenue = ordersPerMonth * ticket;
  const feeMonth = Math.round((revenue * rate) / 100);
  const feeYear = feeMonth * 12;
  const proYear = PRO_MONTHLY * 12;
  const keptYear = Math.max(feeYear - proYear, 0);
  const freeOrders = Math.round(feeMonth / ticket);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">Tus números</p>

        <div className="mt-6 space-y-7">
          <Field
            label="Pedidos por semana"
            value={ordersPerWeek.toString()}
            input={
              <input
                type="range"
                min={10}
                max={400}
                step={5}
                value={ordersPerWeek}
                onChange={(e) => setOrdersPerWeek(Number(e.target.value))}
                aria-label="Pedidos por semana"
                className="range-brand"
              />
            }
          />

          <Field
            label="Ticket promedio"
            value={formatARS(ticket)}
            input={
              <input
                type="range"
                min={4000}
                max={45000}
                step={500}
                value={ticket}
                onChange={(e) => setTicket(Number(e.target.value))}
                aria-label="Ticket promedio"
                className="range-brand"
              />
            }
          />

          <div>
            <div className="mb-3 flex items-baseline justify-between">
              <span className="text-sm font-semibold text-white/70">Comisión de la app</span>
              <span className="font-[family-name:var(--font-heading)] text-lg font-extrabold text-white">
                {rate}%
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {RATES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRate(r)}
                  className={cn(
                    'rounded-xl border px-3 py-2.5 text-sm font-bold transition-colors',
                    rate === r
                      ? 'border-primary bg-primary text-white'
                      : 'border-white/15 bg-white/5 text-white/70 hover:bg-white/10',
                  )}
                >
                  {r}%
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-white/60">
          <MaterialIcon name="info" size="xs" className="mt-0.5 shrink-0" />
          Las apps de delivery en la región cobran entre 20% y 30% del valor del pedido. Movés los
          controles y ponés tus propios números.
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-6 backdrop-blur sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">
          Lo que se lleva la app por año
        </p>
        <p className="mt-2 font-[family-name:var(--font-heading)] text-5xl font-extrabold tracking-tight text-[#ff8f6d] tabular-nums sm:text-6xl">
          {formatARS(feeYear)}
        </p>
        <p className="mt-2 text-sm text-white/60">
          {formatARS(feeMonth)} por mes · sobre {ordersPerMonth} pedidos de {formatARS(ticket)}
        </p>

        <div className="mt-7 space-y-4">
          <Bar
            label={`Comisión de la app (${rate}%)`}
            amount={formatARS(feeYear)}
            width={100}
            tone="loss"
          />
          <Bar
            label="quiero.menu Pro, todo el año"
            amount={formatARS(proYear)}
            width={Math.max(Math.min((proYear / Math.max(feeYear, 1)) * 100, 100), 4)}
            tone="win"
          />
        </div>

        <div className="mt-7 rounded-2xl border border-success/30 bg-success/10 p-5">
          <p className="text-sm font-semibold text-white/70">Diferencia a tu favor con quiero.menu Pro</p>
          <p className="font-[family-name:var(--font-heading)] text-3xl font-extrabold tracking-tight text-[#9ccb8e] tabular-nums sm:text-4xl">
            {formatARS(keptYear)}
          </p>
          <p className="mt-1 text-sm text-white/65">
            {keptYear > 0
              ? `Es como regalar ${freeOrders} pedidos por mes.`
              : 'Con este volumen el plan gratis te alcanza: no pagás nada.'}
          </p>
        </div>

        <Link
          href="/onboarding"
          className="gradient-cta mt-6 flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-bold text-white transition-transform hover:scale-[1.01]"
        >
          Quiero quedarme con esa plata
          <MaterialIcon name="arrow_forward" size="sm" />
        </Link>
        <p className="mt-3 text-center text-xs text-white/60">
          Empezás gratis, sin tarjeta. Pro cuesta {formatARS(PRO_MONTHLY)} al mes y lo cancelás cuando
          quieras.
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  input,
}: {
  label: string;
  value: string;
  input: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <span className="text-sm font-semibold text-white/70">{label}</span>
        <span className="font-[family-name:var(--font-heading)] text-lg font-extrabold text-white tabular-nums">
          {value}
        </span>
      </div>
      {input}
    </div>
  );
}

function Bar({
  label,
  amount,
  width,
  tone,
}: {
  label: string;
  amount: string;
  width: number;
  tone: 'loss' | 'win';
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-sm">
        <span className="text-white/65">{label}</span>
        <span className="font-bold text-white tabular-nums">{amount}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-500 ease-out',
            tone === 'loss'
              ? 'bg-gradient-to-r from-[#ff7a52] to-[#ba1a1a]'
              : 'bg-gradient-to-r from-[#9ccb8e] to-[#33691e]',
          )}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
