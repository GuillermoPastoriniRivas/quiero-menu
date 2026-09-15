import { formatCurrencyParts } from '@/lib/format';

interface MoneyProps {
  amount: number;
  currency: string;
  className?: string;
}

/**
 * Monto con la unidad de moneda en tamaño subordinado al número: el sufijo
 * mide 0.5em, así escala solo con la tipografía del contenedor (5xl del
 * landing tan igual que un KPI text-xl).
 */
export function Money({ amount, currency, className }: MoneyProps) {
  const { number } = formatCurrencyParts(amount, currency);
  return (
    <span className={className}>
      {number}
      <span className="whitespace-nowrap align-baseline text-[0.45em] font-bold tracking-wide text-on-surface-variant">
        {' '}{currency}
      </span>
    </span>
  );
}
