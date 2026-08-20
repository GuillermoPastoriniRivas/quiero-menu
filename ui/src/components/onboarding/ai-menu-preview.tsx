'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MaterialIcon } from '@/components/ui/material-icon';
import { MoneyInput } from '@/components/ui/money-input';
import { OnboardingSteps } from '@/components/onboarding/onboarding-steps';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { MenuVisionOutput, MenuVisionCategory, MenuVisionItem } from '@/types';

interface AiMenuPreviewProps {
  result: MenuVisionOutput;
  onChange: (result: MenuVisionOutput) => void;
  onImport: () => void;
  onBack: () => void;
  error: string | null;
  importLabel?: string;
}

export function AiMenuPreview({
  result,
  onChange,
  onImport,
  onBack,
  error,
  importLabel = 'Importar menu',
}: AiMenuPreviewProps) {
  const [expandedCats, setExpandedCats] = useState<Set<number>>(
    new Set(result.categories.map((_, i) => i)),
  );

  const toggleCat = (i: number) => {
    const next = new Set(expandedCats);
    if (next.has(i)) {
      next.delete(i);
    } else {
      next.add(i);
    }
    setExpandedCats(next);
  };

  const updateRestaurant = (field: string, value: string) => {
    onChange({ ...result, restaurant: { ...result.restaurant, [field]: value } });
  };

  const updateCategory = (catIndex: number, field: keyof MenuVisionCategory, value: string) => {
    const cats = [...result.categories];
    cats[catIndex] = { ...cats[catIndex], [field]: value };
    onChange({ ...result, categories: cats });
  };

  const removeCategory = (catIndex: number) => {
    onChange({ ...result, categories: result.categories.filter((_, i) => i !== catIndex) });
  };

  const addCategory = () => {
    onChange({
      ...result,
      categories: [
        ...result.categories,
        { name: '', description: '', items: [] as MenuVisionItem[] },
      ],
    });
  };

  const updateItem = (catIndex: number, itemIndex: number, field: string, value: string | number) => {
    const cats = [...result.categories];
    const items = [...cats[catIndex].items];
    items[itemIndex] = { ...items[itemIndex], [field]: value };
    cats[catIndex] = { ...cats[catIndex], items };
    onChange({ ...result, categories: cats });
  };

  const removeItem = (catIndex: number, itemIndex: number) => {
    const cats = [...result.categories];
    cats[catIndex] = {
      ...cats[catIndex],
      items: cats[catIndex].items.filter((_, i) => i !== itemIndex),
    };
    onChange({ ...result, categories: cats });
  };

  const addItem = (catIndex: number) => {
    const cats = [...result.categories];
    cats[catIndex] = {
      ...cats[catIndex],
      items: [...cats[catIndex].items, { name: '', description: '', basePrice: 0, itemType: 'simple' }],
    };
    onChange({ ...result, categories: cats });
  };

  const totalItems = result.categories.reduce((sum, c) => sum + c.items.length, 0);

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <span className="inline-flex items-center gap-1.5 gradient-cta text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm shadow-primary/25">
          <MaterialIcon name="check_circle" size="xs" />
          MENU LISTO
        </span>
        <h1
          className="text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Revisa tu menu
        </h1>
        <p className="text-on-surface-variant max-w-md mx-auto">
          La IA encontro {result.categories.length} categorias y {totalItems} platos.
          Corregi lo que necesites antes de publicar.
        </p>
        <div className="flex justify-center gap-2 pt-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1.5 text-sm font-bold">
            <MaterialIcon name="category" size="xs" />
            {result.categories.length} categorias
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1.5 text-sm font-bold">
            <MaterialIcon name="restaurant_menu" size="xs" />
            {totalItems} platos
          </span>
        </div>
      </div>

      <OnboardingSteps current={1} />

      {/* Restaurant info */}
      <Card className="rounded-3xl border-outline-variant/30 shadow-ambient overflow-hidden">
        <CardHeader className="bg-accent/60 border-b border-outline-variant/20 px-5 py-4">
          <CardTitle className="flex items-center gap-2.5 text-base font-bold">
            <span className="w-9 h-9 gradient-cta rounded-xl flex items-center justify-center shadow-md shadow-primary/20 shrink-0">
              <MaterialIcon name="storefront" size="sm" className="text-white" />
            </span>
            Datos del restaurante
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5 px-5 pb-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-on-surface-variant">Nombre</Label>
              <Input
                value={result.restaurant.name || ''}
                onChange={(e) => updateRestaurant('name', e.target.value)}
                placeholder="Nombre del restaurante"
                className="rounded-xl bg-surface-container-lowest"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-on-surface-variant">Telefono</Label>
              <Input
                value={result.restaurant.phone || ''}
                onChange={(e) => updateRestaurant('phone', e.target.value)}
                placeholder="+54..."
                className="rounded-xl bg-surface-container-lowest"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-on-surface-variant">Direccion</Label>
              <Input
                value={result.restaurant.address || ''}
                onChange={(e) => updateRestaurant('address', e.target.value)}
                className="rounded-xl bg-surface-container-lowest"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-on-surface-variant">Ciudad</Label>
              <Input
                value={result.restaurant.city || ''}
                onChange={(e) => updateRestaurant('city', e.target.value)}
                className="rounded-xl bg-surface-container-lowest"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-on-surface-variant">Moneda</Label>
              <Input
                value={result.restaurant.currency || ''}
                onChange={(e) => updateRestaurant('currency', e.target.value)}
                placeholder="ARS"
                className="rounded-xl bg-surface-container-lowest"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories & items */}
      {result.categories.length > 0 ? (
        <div className="space-y-5">
          {result.categories.map((cat, catIndex) => {
            const expanded = expandedCats.has(catIndex);
            return (
              <Card
                key={catIndex}
                className="rounded-3xl border-outline-variant/30 shadow-ambient overflow-hidden"
              >
                <CardHeader
                  className={cn(
                    'cursor-pointer select-none px-5 py-4 transition-colors',
                    expanded ? 'bg-accent/60' : 'bg-surface-container-low/60 hover:bg-accent/40',
                  )}
                  onClick={() => toggleCat(catIndex)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <MaterialIcon
                        name={expanded ? 'expand_more' : 'chevron_right'}
                        size="sm"
                        className="text-primary shrink-0 transition-transform"
                      />
                      <div className="min-w-0">
                        <CardTitle className="text-base font-bold truncate">
                          {cat.name || 'Categoria sin nombre'}
                        </CardTitle>
                        {cat.description && (
                          <p className="text-xs text-on-surface-variant truncate">
                            {cat.description}
                          </p>
                        )}
                      </div>
                      <span className="rounded-full bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 shrink-0">
                        {cat.items.length} items
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCategory(catIndex);
                      }}
                      className="text-destructive hover:text-destructive shrink-0"
                    >
                      <MaterialIcon name="delete_outline" size="sm" />
                      Eliminar
                    </Button>
                  </div>
                </CardHeader>
                {expanded && (
                  <CardContent className="pt-4 px-5 pb-5 space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-on-surface-variant">
                        Nombre de categoria
                      </Label>
                      <Input
                        value={cat.name}
                        onChange={(e) => updateCategory(catIndex, 'name', e.target.value)}
                        className="rounded-xl bg-surface-container-lowest"
                      />
                    </div>

                    {cat.items.map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-3.5 space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 grid gap-2 sm:grid-cols-[1fr_110px]">
                            <div className="relative">
                              <MaterialIcon
                                name="restaurant_menu"
                                size="xs"
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none"
                              />
                              <Input
                                value={item.name}
                                onChange={(e) =>
                                  updateItem(catIndex, itemIndex, 'name', e.target.value)
                                }
                                placeholder="Nombre del plato"
                                className="rounded-xl pl-8"
                              />
                            </div>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-primary pointer-events-none">
                                $
                              </span>
                              <MoneyInput
                                value={String(item.basePrice)}
                                onChange={(v) =>
                                  updateItem(catIndex, itemIndex, 'basePrice', v ? Number(v) : 0)
                                }
                                placeholder="Precio"
                                className="rounded-xl pl-6"
                              />
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => removeItem(catIndex, itemIndex)}
                            className="text-destructive hover:text-destructive rounded-full hover:bg-destructive/10 shrink-0"
                          >
                            <MaterialIcon name="close" size="sm" />
                          </Button>
                        </div>
                        <Textarea
                          value={item.description}
                          onChange={(e) =>
                            updateItem(catIndex, itemIndex, 'description', e.target.value)
                          }
                          placeholder="Descripcion"
                          rows={1}
                          className="rounded-xl text-sm bg-surface-container-lowest"
                        />
                        {item.variants && item.variants.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {item.variants.map((v, vi) => (
                              <span
                                key={vi}
                                className="inline-flex items-center gap-1 rounded-full bg-surface-container-low px-2.5 py-1 text-xs text-on-surface-variant"
                              >
                                {v.name}
                                {v.priceOverride != null && (
                                  <span className="font-bold text-primary">
                                    {formatCurrency(v.priceOverride)}
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                        {item.options && item.options.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {item.options.map((opt, oi) => (
                              <span
                                key={oi}
                                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary"
                              >
                                {opt.name}
                                {opt.priceDelta > 0 && (
                                  <span className="font-bold">+{formatCurrency(opt.priceDelta)}</span>
                                )}
                                <span className="text-primary/60">({opt.optionGroup})</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addItem(catIndex)}
                      className="w-full sm:w-auto rounded-full border-dashed"
                    >
                      <MaterialIcon name="add" size="sm" />
                      Agregar plato
                    </Button>
                  </CardContent>
                )}
              </Card>
            );
          })}

          <Button
            variant="outline"
            onClick={addCategory}
            className="w-full rounded-2xl border-dashed py-6 text-on-surface-variant"
          >
            <MaterialIcon name="add" size="sm" />
            Agregar categoria
          </Button>
        </div>
      ) : (
        <div className="rounded-3xl border-2 border-dashed border-outline-variant/40 p-10 text-center space-y-3 bg-white">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <MaterialIcon name="restaurant_menu" className="text-primary" size="lg" />
          </div>
          <p className="font-bold text-on-surface">No hay categorias</p>
          <p className="text-sm text-on-surface-variant">
            Agrega tu primera categoria para poder publicar el menu.
          </p>
          <Button onClick={addCategory} className="mt-2 rounded-full">
            <MaterialIcon name="add" size="sm" />
            Agregar categoria
          </Button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-error-container/40 text-on-error-container px-4 py-3 text-sm">
          <MaterialIcon name="error" size="sm" className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
        <Button variant="outline" onClick={onBack} className="rounded-2xl">
          <MaterialIcon name="arrow_back" size="sm" />
          Volver a subir
        </Button>
        <Button
          onClick={onImport}
          size="lg"
          disabled={result.categories.length === 0}
          className="w-full sm:w-auto rounded-2xl px-8"
        >
          {importLabel}
          <MaterialIcon name="rocket_launch" size="sm" />
        </Button>
      </div>
    </div>
  );
}