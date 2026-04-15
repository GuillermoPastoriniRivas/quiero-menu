'use client';

import { useEffect, useState, useCallback } from 'react';
import { useMenuStore } from '@/stores/menu.store';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { MaterialIcon } from '@/components/ui/material-icon';
import { ImageUpload } from '@/components/ui/image-upload';
import Link from 'next/link';
import { formatCurrency } from '@/lib/format';
import type { MenuCategory, MenuItem, MenuItemVariant, MenuItemOption, StorefrontData } from '@/types';
import { toast } from 'sonner';

/* ---------- rich item type with nested data ---------- */
type RichItem = MenuItem & {
  variants: MenuItemVariant[];
  options: MenuItemOption[];
};

type RichCategory = MenuCategory & {
  items: RichItem[];
};

/* ====================================================== */
export default function MenuPage() {
  const user = useAuthStore((s) => s.user);
  const {
    createCategory,
    deleteCategory,
    createItem,
    deleteItem,
    toggleAvailability,
    createVariant,
    deleteVariant,
    createOption,
    deleteOption,
  } = useMenuStore();

  const [richCategories, setRichCategories] = useState<RichCategory[]>([]);
  const [loading, setLoading] = useState(true);

  /* --- expanded state --- */
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  /* --- new category --- */
  const [newCatName, setNewCatName] = useState('');

  /* --- new item dialog --- */
  const [newItemCatId, setNewItemCatId] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemImageUrl, setNewItemImageUrl] = useState('');

  /* --- new variant dialog --- */
  const [newVariantItemId, setNewVariantItemId] = useState<string | null>(null);
  const [newVariantName, setNewVariantName] = useState('');
  const [newVariantPrice, setNewVariantPrice] = useState('');

  /* --- new option dialog --- */
  const [newOptionItemId, setNewOptionItemId] = useState<string | null>(null);
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionGroup, setNewOptionGroup] = useState('');
  const [newOptionDelta, setNewOptionDelta] = useState('');

  /* ---------- load full menu via storefront ---------- */
  const loadMenu = useCallback(async () => {
    if (!user?.restaurantSlug) return;
    setLoading(true);
    try {
      const data = await api.get<StorefrontData>(`/storefront/${user.restaurantSlug}`);
      setRichCategories(data.categories);
    } catch {
      toast.error('No se pudo cargar el menu');
    } finally {
      setLoading(false);
    }
  }, [user?.restaurantSlug]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  /* ---------- toggle helpers ---------- */
  const toggleCat = (id: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleItem = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  /* ---------- category actions ---------- */
  const handleCreateCategory = async () => {
    const name = newCatName.trim();
    if (!name) return;
    try {
      await createCategory({ name });
      setNewCatName('');
      toast.success('Categoria creada');
      await loadMenu();
    } catch {
      toast.error('Error al crear categoria');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Eliminar esta categoria y todos sus productos?')) return;
    try {
      await deleteCategory(id);
      toast.success('Categoria eliminada');
      await loadMenu();
    } catch {
      toast.error('Error al eliminar categoria');
    }
  };

  /* ---------- item actions ---------- */
  const handleCreateItem = async () => {
    if (!newItemCatId || !newItemName.trim() || !newItemPrice) return;
    try {
      await createItem({
        categoryId: newItemCatId,
        name: newItemName.trim(),
        basePrice: Number(newItemPrice),
        description: newItemDesc.trim() || undefined,
        imageUrl: newItemImageUrl || undefined,
      });
      setNewItemName('');
      setNewItemPrice('');
      setNewItemDesc('');
      setNewItemImageUrl('');
      setNewItemCatId(null);
      toast.success('Producto creado');
      await loadMenu();
    } catch {
      toast.error('Error al crear producto');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Eliminar este producto?')) return;
    try {
      await deleteItem(id);
      toast.success('Producto eliminado');
      await loadMenu();
    } catch {
      toast.error('Error al eliminar producto');
    }
  };

  const handleToggleAvailability = async (id: string) => {
    try {
      await toggleAvailability(id);
      await loadMenu();
    } catch {
      toast.error('Error al cambiar disponibilidad');
    }
  };

  /* ---------- variant actions ---------- */
  const handleCreateVariant = async () => {
    if (!newVariantItemId || !newVariantName.trim()) return;
    try {
      await createVariant(newVariantItemId, {
        name: newVariantName.trim(),
        priceOverride: newVariantPrice ? Number(newVariantPrice) : undefined,
      });
      setNewVariantName('');
      setNewVariantPrice('');
      setNewVariantItemId(null);
      toast.success('Variante creada');
      await loadMenu();
    } catch {
      toast.error('Error al crear variante');
    }
  };

  const handleDeleteVariant = async (id: string) => {
    if (!confirm('Eliminar esta variante?')) return;
    try {
      await deleteVariant(id);
      toast.success('Variante eliminada');
      await loadMenu();
    } catch {
      toast.error('Error al eliminar variante');
    }
  };

  /* ---------- option actions ---------- */
  const handleCreateOption = async () => {
    if (!newOptionItemId || !newOptionName.trim() || !newOptionGroup.trim()) return;
    try {
      await createOption(newOptionItemId, {
        name: newOptionName.trim(),
        optionGroup: newOptionGroup.trim(),
        priceDelta: newOptionDelta ? Number(newOptionDelta) : 0,
      });
      setNewOptionName('');
      setNewOptionGroup('');
      setNewOptionDelta('');
      setNewOptionItemId(null);
      toast.success('Opcion creada');
      await loadMenu();
    } catch {
      toast.error('Error al crear opcion');
    }
  };

  const handleDeleteOption = async (id: string) => {
    if (!confirm('Eliminar esta opcion?')) return;
    try {
      await deleteOption(id);
      toast.success('Opcion eliminada');
      await loadMenu();
    } catch {
      toast.error('Error al eliminar opcion');
    }
  };

  /* ---------- render ---------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <MaterialIcon name="progress_activity" size="lg" className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Menu</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/onboarding?from=menu"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 h-8 text-sm font-medium hover:bg-muted transition-colors"
          >
            <MaterialIcon name="auto_awesome" size="sm" />
            Importar con IA
          </Link>
          <Badge variant="secondary">{richCategories.length} categorias</Badge>
        </div>
      </div>

      {/* ---- add category ---- */}
      <div className="flex gap-2">
        <Input
          placeholder="Nueva categoria..."
          value={newCatName}
          onChange={(e) => setNewCatName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
        />
        <Button onClick={handleCreateCategory}>
          <MaterialIcon name="add" size="sm" className="mr-2" />
          Agregar
        </Button>
      </div>

      {/* ---- categories ---- */}
      {richCategories.map((cat) => {
        const catOpen = expandedCats.has(cat.id);
        return (
          <Card key={cat.id}>
            <CardHeader
              className="flex flex-row items-center justify-between cursor-pointer select-none"
              onClick={() => toggleCat(cat.id)}
            >
              <div className="flex items-center gap-2">
                {catOpen ? <MaterialIcon name="expand_more" size="sm" /> : <MaterialIcon name="chevron_right" size="sm" />}
                <CardTitle className="text-lg">{cat.name}</CardTitle>
                <Badge variant="outline" className="ml-2">{cat.items.length} productos</Badge>
              </div>
              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setNewItemCatId(cat.id);
                    setNewItemName('');
                    setNewItemPrice('');
                    setNewItemDesc('');
                    setNewItemImageUrl('');
                  }}
                >
                  <MaterialIcon name="add" size="xs" className="mr-1" />
                  Producto
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDeleteCategory(cat.id)}>
                  <MaterialIcon name="delete" size="sm" className="text-destructive" />
                </Button>
              </div>
            </CardHeader>

            {catOpen && (
              <CardContent className="pt-0 space-y-2">
                {cat.items.length === 0 && (
                  <p className="text-sm text-muted-foreground py-2">Sin productos en esta categoria.</p>
                )}

                {cat.items.map((item) => {
                  const itemOpen = expandedItems.has(item.id);
                  const hasExtras = item.variants.length > 0 || item.options.length > 0;

                  return (
                    <div key={item.id} className="border rounded-lg">
                      {/* item header */}
                      <div
                        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                        onClick={() => toggleItem(item.id)}
                      >
                        <div className="flex items-center gap-3">
                          {hasExtras ? (
                            itemOpen ? <MaterialIcon name="expand_more" size="sm" className="text-muted-foreground" /> : <MaterialIcon name="chevron_right" size="sm" className="text-muted-foreground" />
                          ) : (
                            <MaterialIcon name="inventory_2" size="sm" className="text-muted-foreground" />
                          )}
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                              <MaterialIcon name="restaurant" size="sm" className="text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <span className="font-medium">{item.name}</span>
                            {item.description && (
                              <p className="text-xs text-muted-foreground">{item.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                          <span className="text-sm font-semibold">{formatCurrency(item.basePrice)}</span>
                          {!item.isAvailable && <Badge variant="secondary">No disponible</Badge>}
                          <Switch
                            checked={item.isAvailable}
                            onCheckedChange={() => handleToggleAvailability(item.id)}
                          />
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteItem(item.id)}>
                            <MaterialIcon name="delete" size="xs" className="text-destructive" />
                          </Button>
                        </div>
                      </div>

                      {/* item details */}
                      {itemOpen && (
                        <div className="px-4 pb-4 space-y-4">
                          <Separator />

                          {/* --- variants section --- */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <MaterialIcon name="layers" size="sm" className="text-muted-foreground" />
                                <span className="text-sm font-medium">Variantes</span>
                                <Badge variant="outline" className="text-xs">{item.variants.length}</Badge>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setNewVariantItemId(item.id);
                                  setNewVariantName('');
                                  setNewVariantPrice('');
                                }}
                              >
                                <MaterialIcon name="add" size="xs" className="mr-1" />
                                Variante
                              </Button>
                            </div>

                            {item.variants.length === 0 && (
                              <p className="text-xs text-muted-foreground pl-6">Sin variantes.</p>
                            )}

                            {item.variants.map((v) => (
                              <div key={v.id} className="flex items-center justify-between pl-6 py-1.5 border-l-2 border-muted ml-2">
                                <div className="pl-2">
                                  <span className="text-sm">{v.name}</span>
                                  {v.priceOverride != null && (
                                    <span className="text-xs text-muted-foreground ml-2">
                                      {formatCurrency(v.priceOverride)}
                                    </span>
                                  )}
                                </div>
                                <Button size="sm" variant="ghost" onClick={() => handleDeleteVariant(v.id)}>
                                  <MaterialIcon name="delete" size="xs" className="text-destructive" />
                                </Button>
                              </div>
                            ))}
                          </div>

                          <Separator />

                          {/* --- options section --- */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <MaterialIcon name="tune" size="sm" className="text-muted-foreground" />
                                <span className="text-sm font-medium">Opciones</span>
                                <Badge variant="outline" className="text-xs">{item.options.length}</Badge>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setNewOptionItemId(item.id);
                                  setNewOptionName('');
                                  setNewOptionGroup('');
                                  setNewOptionDelta('');
                                }}
                              >
                                <MaterialIcon name="add" size="xs" className="mr-1" />
                                Opcion
                              </Button>
                            </div>

                            {item.options.length === 0 && (
                              <p className="text-xs text-muted-foreground pl-6">Sin opciones.</p>
                            )}

                            {/* group options by optionGroup */}
                            {Object.entries(
                              item.options.reduce<Record<string, MenuItemOption[]>>((acc, opt) => {
                                (acc[opt.optionGroup] ??= []).push(opt);
                                return acc;
                              }, {}),
                            ).map(([group, opts]) => (
                              <div key={group} className="pl-6 ml-2 border-l-2 border-muted">
                                <p className="text-xs font-medium text-muted-foreground pl-2 pb-1">{group}</p>
                                {opts.map((opt) => (
                                  <div key={opt.id} className="flex items-center justify-between pl-2 py-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm">{opt.name}</span>
                                      {opt.priceDelta > 0 && (
                                        <Badge variant="secondary" className="text-xs">
                                          +{formatCurrency(opt.priceDelta)}
                                        </Badge>
                                      )}
                                    </div>
                                    <Button size="sm" variant="ghost" onClick={() => handleDeleteOption(opt.id)}>
                                      <MaterialIcon name="delete" size="xs" className="text-destructive" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            )}
          </Card>
        );
      })}

      {richCategories.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          No hay categorias. Crea tu primera categoria para empezar.
        </p>
      )}

      {/* ============== DIALOGS ============== */}

      {/* --- new item dialog --- */}
      <Dialog open={newItemCatId !== null} onOpenChange={(open) => !open && setNewItemCatId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Agregar producto
              {newItemCatId && (
                <span className="font-normal text-muted-foreground text-sm ml-2">
                  en {richCategories.find((c) => c.id === newItemCatId)?.name}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <ImageUpload
              value={newItemImageUrl}
              onChange={setNewItemImageUrl}
              type="menu"
              label="Foto del producto"
              aspectRatio="square"
            />
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Hamburguesa clasica"
              />
            </div>
            <div className="space-y-1">
              <Label>Precio base</Label>
              <Input
                type="number"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
                placeholder="15000"
              />
            </div>
            <div className="space-y-1">
              <Label>Descripcion (opcional)</Label>
              <Input
                value={newItemDesc}
                onChange={(e) => setNewItemDesc(e.target.value)}
                placeholder="Carne 150g, queso, lechuga..."
              />
            </div>
            <Button className="w-full" onClick={handleCreateItem}>
              Crear producto
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- new variant dialog --- */}
      <Dialog open={newVariantItemId !== null} onOpenChange={(open) => !open && setNewVariantItemId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar variante</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input
                value={newVariantName}
                onChange={(e) => setNewVariantName(e.target.value)}
                placeholder="Grande"
              />
            </div>
            <div className="space-y-1">
              <Label>Precio (sobreescribe el base, opcional)</Label>
              <Input
                type="number"
                value={newVariantPrice}
                onChange={(e) => setNewVariantPrice(e.target.value)}
                placeholder="20000"
              />
            </div>
            <Button className="w-full" onClick={handleCreateVariant}>
              Crear variante
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- new option dialog --- */}
      <Dialog open={newOptionItemId !== null} onOpenChange={(open) => !open && setNewOptionItemId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar opcion</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Grupo</Label>
              <Input
                value={newOptionGroup}
                onChange={(e) => setNewOptionGroup(e.target.value)}
                placeholder="Extras, Salsas, Toppings..."
              />
            </div>
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input
                value={newOptionName}
                onChange={(e) => setNewOptionName(e.target.value)}
                placeholder="Queso extra"
              />
            </div>
            <div className="space-y-1">
              <Label>Precio adicional (0 si no aplica)</Label>
              <Input
                type="number"
                value={newOptionDelta}
                onChange={(e) => setNewOptionDelta(e.target.value)}
                placeholder="3000"
              />
            </div>
            <Button className="w-full" onClick={handleCreateOption}>
              Crear opcion
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
