'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { MaterialIcon } from '@/components/ui/material-icon';
import { cn } from '@/lib/utils';
import type { MenuVisionCategory, MenuVisionItem, MenuVisionOutput } from '@/types';

export function MenuReview({
  menu,
  onChange,
}: {
  menu: MenuVisionOutput;
  onChange: (menu: MenuVisionOutput) => void;
}) {
  const [open, setOpen] = useState<Set<number>>(() => new Set(menu.categories.length <= 3 ? menu.categories.map((_, i) => i) : [0]));

  const toggle = (index: number) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  const updateCategory = (index: number, patch: Partial<MenuVisionCategory>) => {
    const categories = menu.categories.map((c, i) => (i === index ? { ...c, ...patch } : c));
    onChange({ ...menu, categories });
  };

  const updateItem = (catIndex: number, itemIndex: number, patch: Partial<MenuVisionItem>) => {
    const items = menu.categories[catIndex].items.map((item, i) => (i === itemIndex ? { ...item, ...patch } : item));
    updateCategory(catIndex, { items });
  };

  const removeItem = (catIndex: number, itemIndex: number) => {
    updateCategory(catIndex, { items: menu.categories[catIndex].items.filter((_, i) => i !== itemIndex) });
  };

  const addItem = (catIndex: number) => {
    updateCategory(catIndex, {
      items: [...menu.categories[catIndex].items, { name: '', description: '', basePrice: 0, itemType: 'simple' }],
    });
  };

  const removeCategory = (index: number) => {
    onChange({ ...menu, categories: menu.categories.filter((_, i) => i !== index) });
  };

  const addCategory = () => {
    onChange({ ...menu, categories: [...menu.categories, { name: 'Nueva categoría', description: '', items: [] }] });
    setOpen((current) => new Set(current).add(menu.categories.length));
  };

  return (
    <div className="space-y-3">
      {menu.categories.map((category, catIndex) => {
        const expanded = open.has(catIndex);
        const zeroPrices = category.items.filter((i) => !i.basePrice).length;
        return (
          <section
            key={catIndex}
            className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm"
          >
            <div className="flex items-center gap-2 px-4 py-3">
              <button
                type="button"
                onClick={() => toggle(catIndex)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
                aria-expanded={expanded}
              >
                <MaterialIcon
                  name="expand_more"
                  size="sm"
                  className={cn('shrink-0 text-primary transition-transform', !expanded && '-rotate-90')}
                />
                <span className="truncate font-[family-name:var(--font-heading)] font-bold text-on-surface">
                  {category.name || 'Sin nombre'}
                </span>
                <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                  {category.items.length}
                </span>
                {zeroPrices > 0 && (
                  <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">
                    {zeroPrices} sin precio
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => removeCategory(catIndex)}
                aria-label="Quitar categoría"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-error-container/40 hover:text-error"
              >
                <MaterialIcon name="delete_outline" size="sm" />
              </button>
            </div>

            {expanded && (
              <div className="space-y-2 border-t border-outline-variant/20 bg-surface-container-low/40 px-3 py-3">
                <Input
                  value={category.name}
                  onChange={(e) => updateCategory(catIndex, { name: e.target.value })}
                  aria-label="Nombre de la categoría"
                  className="h-9 bg-surface-container-lowest font-semibold"
                />
                {category.items.map((item, itemIndex) => (
                  <div
                    key={itemIndex}
                    className="grid grid-cols-[1fr_7rem_auto] items-center gap-2 rounded-xl bg-surface-container-lowest p-2"
                  >
                    <Input
                      value={item.name}
                      onChange={(e) => updateItem(catIndex, itemIndex, { name: e.target.value })}
                      placeholder="Nombre del plato"
                      className="h-9 border-none bg-transparent px-2 shadow-none"
                    />
                    <div className="relative">
                      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-primary">
                        $
                      </span>
                      <MoneyInput
                        value={item.basePrice ? String(item.basePrice) : ''}
                        onChange={(v) => updateItem(catIndex, itemIndex, { basePrice: v ? Number(v) : 0 })}
                        placeholder="Precio"
                        className={cn('h-9 pl-6', !item.basePrice && 'ring-1 ring-amber-300')}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(catIndex, itemIndex)}
                      aria-label="Quitar plato"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-error-container/40 hover:text-error"
                    >
                      <MaterialIcon name="close" size="xs" />
                    </button>
                    {(item.variants?.length ?? 0) > 0 && (
                      <p className="col-span-3 px-2 text-[11px] text-on-surface-variant">
                        Variantes: {item.variants!.map((v) => v.name).join(', ')}
                      </p>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addItem(catIndex)}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/10"
                >
                  <MaterialIcon name="add" size="xs" />
                  Agregar plato
                </button>
              </div>
            )}
          </section>
        );
      })}
      <button
        type="button"
        onClick={addCategory}
        className="flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-outline-variant/50 py-3 text-sm font-bold text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary"
      >
        <MaterialIcon name="add" size="sm" />
        Agregar categoría
      </button>
    </div>
  );
}
