'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MenuVisionOutput, MenuVisionCategory, MenuVisionItem } from '@/types';

interface AiMenuPreviewProps {
  result: MenuVisionOutput;
  onChange: (result: MenuVisionOutput) => void;
  onImport: () => void;
  onBack: () => void;
  error: string | null;
}

export function AiMenuPreview({ result, onChange, onImport, onBack, error }: AiMenuPreviewProps) {
  const [expandedCats, setExpandedCats] = useState<Set<number>>(
    new Set(result.categories.map((_, i) => i)),
  );

  const toggleCat = (i: number) => {
    const next = new Set(expandedCats);
    next.has(i) ? next.delete(i) : next.add(i);
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

  const totalItems = result.categories.reduce((sum, c) => sum + c.items.length, 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Revisa tu menu</h1>
        <p className="text-muted-foreground">
          La IA encontro {result.categories.length} categorias y {totalItems} items. Edita lo que necesites antes de importar.
        </p>
      </div>

      {/* Restaurant info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Datos del restaurante</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Nombre</Label>
              <Input
                value={result.restaurant.name || ''}
                onChange={(e) => updateRestaurant('name', e.target.value)}
                placeholder="Nombre del restaurante"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Telefono</Label>
              <Input
                value={result.restaurant.phone || ''}
                onChange={(e) => updateRestaurant('phone', e.target.value)}
                placeholder="+57..."
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Direccion</Label>
              <Input
                value={result.restaurant.address || ''}
                onChange={(e) => updateRestaurant('address', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Ciudad</Label>
              <Input
                value={result.restaurant.city || ''}
                onChange={(e) => updateRestaurant('city', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Moneda</Label>
              <Input
                value={result.restaurant.currency || ''}
                onChange={(e) => updateRestaurant('currency', e.target.value)}
                placeholder="COP"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories & items */}
      <div className="space-y-4">
        {result.categories.map((cat, catIndex) => (
          <Card key={catIndex}>
            <CardHeader
              className="cursor-pointer select-none"
              onClick={() => toggleCat(catIndex)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{expandedCats.has(catIndex) ? '▼' : '▶'}</span>
                  <CardTitle className="text-base">{cat.name}</CardTitle>
                  <span className="text-xs text-muted-foreground">
                    ({cat.items.length} items)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeCategory(catIndex);
                  }}
                  className="text-destructive hover:text-destructive"
                >
                  Eliminar
                </Button>
              </div>
            </CardHeader>
            {expandedCats.has(catIndex) && (
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Nombre de categoria</Label>
                  <Input
                    value={cat.name}
                    onChange={(e) => updateCategory(catIndex, 'name', e.target.value)}
                  />
                </div>

                {cat.items.map((item, itemIndex) => (
                  <div
                    key={itemIndex}
                    className="rounded-md border p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 grid gap-2 sm:grid-cols-[1fr_100px]">
                        <Input
                          value={item.name}
                          onChange={(e) =>
                            updateItem(catIndex, itemIndex, 'name', e.target.value)
                          }
                          placeholder="Nombre del plato"
                        />
                        <Input
                          type="number"
                          value={item.basePrice}
                          onChange={(e) =>
                            updateItem(catIndex, itemIndex, 'basePrice', Number(e.target.value))
                          }
                          placeholder="Precio"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(catIndex, itemIndex)}
                        className="text-destructive hover:text-destructive shrink-0"
                      >
                        X
                      </Button>
                    </div>
                    <Textarea
                      value={item.description}
                      onChange={(e) =>
                        updateItem(catIndex, itemIndex, 'description', e.target.value)
                      }
                      placeholder="Descripcion"
                      rows={1}
                      className="text-sm"
                    />
                    {item.variants && item.variants.length > 0 && (
                      <div className="pl-3 border-l-2 space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Variantes</p>
                        {item.variants.map((v, vi) => (
                          <div key={vi} className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">-</span>
                            <span>{v.name}</span>
                            {v.priceOverride != null && (
                              <span className="text-muted-foreground">${v.priceOverride.toLocaleString()}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {item.options && item.options.length > 0 && (
                      <div className="pl-3 border-l-2 space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Opciones</p>
                        {item.options.map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">-</span>
                            <span>{opt.name}</span>
                            {opt.priceDelta > 0 && (
                              <span className="text-muted-foreground">+${opt.priceDelta.toLocaleString()}</span>
                            )}
                            <span className="text-xs text-muted-foreground">({opt.optionGroup})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {error && <p className="text-sm text-destructive text-center">{error}</p>}

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          Volver
        </Button>
        <Button onClick={onImport} size="lg" disabled={result.categories.length === 0}>
          Importar menu
        </Button>
      </div>
    </div>
  );
}
