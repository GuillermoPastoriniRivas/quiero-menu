import type { OrderItemComponent, SelectedOption } from '@/types';
import { selectedOptionsLabel } from '@/lib/menu-options';

/** Cantidades por unidad del producto/promo; la cantidad del renglón se muestra afuera. */
export function OrderItemSelections({ options = [], components = [], legacyNames = [] }: {
  options?: SelectedOption[];
  components?: OrderItemComponent[];
  legacyNames?: string[];
}) {
  return <div className="mt-0.5 space-y-1 text-on-surface-variant">
    {(options.length > 0 || legacyNames.length > 0) && <p>{options.length ? selectedOptionsLabel(options) : legacyNames.join(', ')}</p>}
    {components.map(c => <div key={c.slotId} className="border-l-2 border-outline-variant/40 pl-2">
      <p><span className="font-medium">{c.slotName}: {c.quantity ?? 1}× {c.menuItemName}</span>{c.variantName ? ` (${c.variantName})` : ''}</p>
      {c.selectedOptions?.length > 0 && <p className="pl-2">{selectedOptionsLabel(c.selectedOptions)} <span className="opacity-75">· por unidad</span></p>}
    </div>)}
  </div>;
}
