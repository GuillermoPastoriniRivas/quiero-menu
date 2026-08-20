'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
import { MoneyInput } from '@/components/ui/money-input';
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

/* ---------- dialog states ---------- */
type CatDialog = { mode: 'create' } | { mode: 'edit'; cat: RichCategory } | null;
type ItemDialog = { mode: 'create'; catId: string } | { mode: 'edit'; item: RichItem } | null;
type VariantDialog = { mode: 'create'; itemId: string } | { mode: 'edit'; variant: MenuItemVariant } | null;
type OptionDialog = { mode: 'create'; itemId: string } | { mode: 'edit'; option: MenuItemOption } | null;

/* ====================================================== */
export default function MenuPage() {
  const user = useAuthStore((s) => s.user);
  const {
    createCategory,
    updateCategory,
    deleteCategory,
    createItem,
    updateItem,
    deleteItem,
    toggleAvailability,
    createVariant,
    updateVariant,
    deleteVariant,
    createOption,
    updateOption,
    deleteOption,
  } = useMenuStore();

  const [richCategories, setRichCategories] = useState<RichCategory[]>([]);
  const [loading, setLoading] = useState(true);

  /* --- expanded state --- */
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  /* --- dialog state --- */
  const [catDialog, setCatDialog] = useState<CatDialog>(null);
  const [catForm, setCatForm] = useState({ name: '', description: '' });

  const [itemDialog, setItemDialog] = useState<ItemDialog>(null);
  const [itemForm, setItemForm] = useState({ name: '', price: '', description: '', imageUrl: '' });

  const [variantDialog, setVariantDialog] = useState<VariantDialog>(null);
  const [variantForm, setVariantForm] = useState({ name: '', price: '' });

  const [optionDialog, setOptionDialog] = useState<OptionDialog>(null);
  const [optionForm, setOptionForm] = useState({ name: '', group: '', delta: '' });

  /* --- inline price editing --- */
  const [priceEdit, setPriceEdit] = useState<
    { kind: 'item'; id: string } | { kind: 'variant'; id: string } | { kind: 'option'; id: string } | null
  >(null);
  const [priceDraft, setPriceDraft] = useState('');
  const cancelBlurRef = useRef(false);

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
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleItem = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  /* ---------- inline price editing ---------- */
  const openPriceEdit = (
    target: { kind: 'item'; id: string } | { kind: 'variant'; id: string } | { kind: 'option'; id: string },
    current: string,
  ) => {
    setPriceEdit(target);
    setPriceDraft(current);
  };

  const applyPriceLocally = (
    target: { kind: 'item' | 'variant' | 'option'; id: string },
    resolved: number | null,
  ) => {
    setRichCategories((cats) =>
      cats.map((cat) => ({
        ...cat,
        items: cat.items.map((item) => {
          if (target.kind === 'item' && item.id === target.id) {
            return { ...item, basePrice: resolved ?? 0 };
          }
          if (target.kind === 'variant') {
            return {
              ...item,
              variants: item.variants.map((v) =>
                v.id === target.id ? { ...v, priceOverride: resolved } : v,
              ),
            };
          }
          if (target.kind === 'option') {
            return {
              ...item,
              options: item.options.map((o) =>
                o.id === target.id ? { ...o, priceDelta: resolved ?? 0 } : o,
              ),
            };
          }
          return item;
        }),
      })),
    );
  };

  const commitPriceEdit = async () => {
    if (!priceEdit) return;
    const target = priceEdit;
    const value = Number(priceDraft || '0');
    const resolved = target.kind === 'variant' ? (priceDraft ? value : null) : value;
    try {
      if (target.kind === 'item') {
        await updateItem(target.id, { basePrice: value });
      } else if (target.kind === 'variant') {
        await updateVariant(target.id, { priceOverride: resolved });
      } else {
        await updateOption(target.id, { priceDelta: value });
      }
      setPriceEdit(null);
      setPriceDraft('');
      applyPriceLocally(target, resolved);
    } catch {
      toast.error('Error al actualizar precio');
    }
  };

  const handlePriceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      cancelBlurRef.current = true;
      e.currentTarget.blur();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  const handlePriceBlur = () => {
    if (cancelBlurRef.current) {
      cancelBlurRef.current = false;
      setPriceEdit(null);
      setPriceDraft('');
      return;
    }
    commitPriceEdit();
  };

  /* ---------- dialog openers ---------- */
  const openCatCreate = () => {
    setCatDialog({ mode: 'create' });
    setCatForm({ name: '', description: '' });
  };
  const openCatEdit = (cat: RichCategory) => {
    setCatDialog({ mode: 'edit', cat });
    setCatForm({ name: cat.name, description: cat.description || '' });
  };

  const openItemCreate = (catId: string) => {
    setItemDialog({ mode: 'create', catId });
    setItemForm({ name: '', price: '', description: '', imageUrl: '' });
  };
  const openItemEdit = (item: RichItem) => {
    setItemDialog({ mode: 'edit', item });
    setItemForm({
      name: item.name,
      price: String(item.basePrice),
      description: item.description || '',
      imageUrl: item.imageUrl || '',
    });
  };

  const openVariantCreate = (itemId: string) => {
    setVariantDialog({ mode: 'create', itemId });
    setVariantForm({ name: '', price: '' });
  };
  const openVariantEdit = (variant: MenuItemVariant) => {
    setVariantDialog({ mode: 'edit', variant });
    setVariantForm({
      name: variant.name,
      price: variant.priceOverride != null ? String(variant.priceOverride) : '',
    });
  };

  const openOptionCreate = (itemId: string) => {
    setOptionDialog({ mode: 'create', itemId });
    setOptionForm({ name: '', group: '', delta: '' });
  };
  const openOptionEdit = (option: MenuItemOption) => {
    setOptionDialog({ mode: 'edit', option });
    setOptionForm({
      name: option.name,
      group: option.optionGroup,
      delta: option.priceDelta ? String(option.priceDelta) : '',
    });
  };

  /* ---------- category actions ---------- */
  const handleSaveCategory = async () => {
    if (!catDialog) return;
    const name = catForm.name.trim();
    if (!name) return;
    try {
      if (catDialog.mode === 'edit') {
        await updateCategory(catDialog.cat.id, {
          name,
          description: catForm.description.trim(),
        });
        toast.success('Categoria actualizada');
      } else {
        await createCategory({
          name,
          description: catForm.description.trim() || undefined,
        });
        toast.success('Categoria creada');
      }
      setCatDialog(null);
      await loadMenu();
    } catch {
      toast.error(catDialog.mode === 'edit' ? 'Error al actualizar categoria' : 'Error al crear categoria');
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
  const handleSaveItem = async () => {
    if (!itemDialog || !itemForm.name.trim() || !itemForm.price) return;
    try {
      const payload = {
        name: itemForm.name.trim(),
        basePrice: Number(itemForm.price),
        description: itemForm.description.trim(),
        imageUrl: itemForm.imageUrl,
      };
      if (itemDialog.mode === 'edit') {
        await updateItem(itemDialog.item.id, payload);
        toast.success('Producto actualizado');
      } else {
        await createItem({
          categoryId: itemDialog.catId,
          ...payload,
          imageUrl: itemForm.imageUrl || undefined,
        });
        toast.success('Producto creado');
      }
      setItemDialog(null);
      await loadMenu();
    } catch {
      toast.error(itemDialog.mode === 'edit' ? 'Error al actualizar producto' : 'Error al crear producto');
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

  const applyAvailabilityLocally = (id: string, available: boolean) => {
    setRichCategories((cats) =>
      cats.map((cat) => ({
        ...cat,
        items: cat.items.map((item) =>
          item.id === id ? { ...item, isAvailable: available } : item,
        ),
      })),
    );
  };

  const handleToggleAvailability = async (id: string, next: boolean) => {
    try {
      await toggleAvailability(id);
      applyAvailabilityLocally(id, next);
    } catch {
      toast.error('Error al cambiar disponibilidad');
      applyAvailabilityLocally(id, !next);
    }
  };

  /* ---------- variant actions ---------- */
  const handleSaveVariant = async () => {
    if (!variantDialog || !variantForm.name.trim()) return;
    try {
      const payload = {
        name: variantForm.name.trim(),
        priceOverride: variantForm.price ? Number(variantForm.price) : null,
      };
      if (variantDialog.mode === 'edit') {
        await updateVariant(variantDialog.variant.id, payload);
        toast.success('Variante actualizada');
      } else {
        await createVariant(variantDialog.itemId, payload);
        toast.success('Variante creada');
      }
      setVariantDialog(null);
      await loadMenu();
    } catch {
      toast.error(variantDialog.mode === 'edit' ? 'Error al actualizar variante' : 'Error al crear variante');
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
  const handleSaveOption = async () => {
    if (!optionDialog || !optionForm.name.trim() || !optionForm.group.trim()) return;
    try {
      const payload = {
        name: optionForm.name.trim(),
        optionGroup: optionForm.group.trim(),
        priceDelta: optionForm.delta ? Number(optionForm.delta) : 0,
      };
      if (optionDialog.mode === 'edit') {
        await updateOption(optionDialog.option.id, payload);
        toast.success('Opcion actualizada');
      } else {
        await createOption(optionDialog.itemId, payload);
        toast.success('Opcion creada');
      }
      setOptionDialog(null);
      await loadMenu();
    } catch {
      toast.error(optionDialog.mode === 'edit' ? 'Error al actualizar opcion' : 'Error al crear opcion');
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
      <div className="flex flex-wrap items-center justify-between gap-3">
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

      {/* ---- add category (looks like a category) ---- */}
      <button
        type="button"
        onClick={openCatCreate}
        className="flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/30 px-4 py-3 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          <MaterialIcon name="category" size="sm" />
        </span>
        <span className="font-medium">Agregar categoria</span>
        <MaterialIcon name="add_circle" className="ml-auto text-foreground/60" />
      </button>

      {/* ---- categories ---- */}
      {richCategories.map((cat) => {
        const catOpen = expandedCats.has(cat.id);
        return (
          <Card key={cat.id}>
            <CardHeader
              className="flex flex-row items-center justify-between gap-2 flex-wrap cursor-pointer select-none"
              onClick={() => toggleCat(cat.id)}
            >
              <div className="flex items-center gap-2 min-w-0">
                {catOpen ? <MaterialIcon name="expand_more" size="sm" /> : <MaterialIcon name="chevron_right" size="sm" />}
                <CardTitle className="text-lg truncate">{cat.name}</CardTitle>
                <Badge variant="outline" className="ml-2 shrink-0">{cat.items.length} productos</Badge>
              </div>
              <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                <Button size="sm" variant="ghost" onClick={() => openCatEdit(cat)}>
                  <MaterialIcon name="edit" size="sm" />
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
                        className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 py-3 cursor-pointer select-none sm:gap-3"
                        onClick={() => toggleItem(item.id)}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {hasExtras ? (
                            itemOpen ? <MaterialIcon name="expand_more" size="sm" className="text-muted-foreground" /> : <MaterialIcon name="chevron_right" size="sm" className="text-muted-foreground" />
                          ) : (
                            <MaterialIcon name="inventory_2" size="sm" className="text-muted-foreground" />
                          )}
                          {item.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover shrink-0" />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0">
                              <MaterialIcon name="restaurant" size="sm" className="text-muted-foreground" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-medium">{item.name}</span>
                            {item.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 sm:gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                          {priceEdit?.kind === 'item' && priceEdit.id === item.id ? (
                            <MoneyInput
                              autoFocus
                              value={priceDraft}
                              onChange={setPriceDraft}
                              onKeyDown={handlePriceKeyDown}
                              onBlur={handlePriceBlur}
                              className="w-24"
                              aria-label={`Precio de ${item.name}`}
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => openPriceEdit({ kind: 'item', id: item.id }, String(item.basePrice))}
                              className="whitespace-nowrap rounded px-1.5 py-0.5 text-sm font-semibold transition-colors hover:bg-muted"
                              title="Editar precio"
                            >
                              {formatCurrency(item.basePrice)}
                            </button>
                          )}
                          {!item.isAvailable && <Badge variant="secondary">No disponible</Badge>}
                          <Switch
                            checked={item.isAvailable}
                            onCheckedChange={(checked) => handleToggleAvailability(item.id, checked)}
                          />
                          <Button size="sm" variant="ghost" onClick={() => openItemEdit(item)}>
                            <MaterialIcon name="edit" size="xs" />
                          </Button>
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
                            <div className="flex items-center gap-2">
                              <MaterialIcon name="layers" size="sm" className="text-muted-foreground" />
                              <span className="text-sm font-medium">Variantes</span>
                              <Badge variant="outline" className="text-xs">{item.variants.length}</Badge>
                            </div>

                            {item.variants.length === 0 && (
                              <p className="text-xs text-muted-foreground pl-6">Sin variantes.</p>
                            )}

                            {item.variants.map((v) => (
                              <div key={v.id} className="flex items-center justify-between pl-6 py-1.5 border-l-2 border-muted ml-2">
                                <div className="pl-2 flex items-center gap-1">
                                  <span className="text-sm">{v.name}</span>
                                  {priceEdit?.kind === 'variant' && priceEdit.id === v.id ? (
                                    <MoneyInput
                                      autoFocus
                                      value={priceDraft}
                                      onChange={setPriceDraft}
                                      onKeyDown={handlePriceKeyDown}
                                      onBlur={handlePriceBlur}
                                      className="h-7 w-24 text-xs"
                                      aria-label={`Precio de ${v.name}`}
                                    />
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openPriceEdit(
                                          { kind: 'variant', id: v.id },
                                          v.priceOverride != null ? String(v.priceOverride) : '',
                                        )
                                      }
                                      className="rounded px-1 py-0.5 transition-colors hover:bg-muted"
                                      title="Editar precio"
                                    >
                                      {v.priceOverride != null ? (
                                        <span className="text-xs text-muted-foreground">
                                          {formatCurrency(v.priceOverride)}
                                        </span>
                                      ) : (
                                        <MaterialIcon name="payments" size="xs" className="text-muted-foreground/60" />
                                      )}
                                    </button>
                                  )}
                                </div>
                                <div className="flex gap-1">
                                  <Button size="sm" variant="ghost" onClick={() => openVariantEdit(v)}>
                                    <MaterialIcon name="edit" size="xs" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => handleDeleteVariant(v.id)}>
                                    <MaterialIcon name="delete" size="xs" className="text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            ))}

                            {/* add variant (looks like a variant row) */}
                            <button
                              type="button"
                              onClick={() => openVariantCreate(item.id)}
                              className="ml-2 flex w-full items-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 px-2 py-1.5 pl-6 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted"
                            >
                              <MaterialIcon name="add" size="xs" />
                              <span className="text-sm">Agregar variante</span>
                            </button>
                          </div>

                          <Separator />

                          {/* --- options section --- */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <MaterialIcon name="tune" size="sm" className="text-muted-foreground" />
                              <span className="text-sm font-medium">Opciones</span>
                              <Badge variant="outline" className="text-xs">{item.options.length}</Badge>
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
                                      {opt.priceDelta > 0 &&
                                        (priceEdit?.kind === 'option' && priceEdit.id === opt.id ? (
                                          <MoneyInput
                                            autoFocus
                                            value={priceDraft}
                                            onChange={setPriceDraft}
                                            onKeyDown={handlePriceKeyDown}
                                            onBlur={handlePriceBlur}
                                            className="h-7 w-20 text-xs"
                                            aria-label={`Precio adicional de ${opt.name}`}
                                          />
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => openPriceEdit({ kind: 'option', id: opt.id }, String(opt.priceDelta))}
                                            className="rounded px-0.5 py-0.5 transition-colors hover:bg-muted"
                                            title="Editar precio"
                                          >
                                            <Badge variant="secondary" className="text-xs">
                                              +{formatCurrency(opt.priceDelta)}
                                            </Badge>
                                          </button>
                                        ))}
                                    </div>
                                    <div className="flex gap-1">
                                      <Button size="sm" variant="ghost" onClick={() => openOptionEdit(opt)}>
                                        <MaterialIcon name="edit" size="xs" />
                                      </Button>
                                      <Button size="sm" variant="ghost" onClick={() => handleDeleteOption(opt.id)}>
                                        <MaterialIcon name="delete" size="xs" className="text-destructive" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ))}

                            {/* add option (looks like an option row) */}
                            <button
                              type="button"
                              onClick={() => openOptionCreate(item.id)}
                              className="ml-2 flex w-full items-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 px-2 py-1.5 pl-6 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted"
                            >
                              <MaterialIcon name="add" size="xs" />
                              <span className="text-sm">Agregar opcion</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* add product (looks like a product row) */}
                <button
                  type="button"
                  onClick={() => openItemCreate(cat.id)}
                  className="flex w-full items-center gap-3 rounded-lg border-2 border-dashed border-border bg-muted/30 px-4 py-3 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <MaterialIcon name="restaurant" size="sm" />
                  </span>
                  <span className="text-sm font-medium">Agregar producto</span>
                  <MaterialIcon name="add_circle" className="ml-auto text-foreground/60" />
                </button>
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

      {/* --- category dialog --- */}
      <Dialog open={catDialog !== null} onOpenChange={(open) => !open && setCatDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {catDialog?.mode === 'edit' ? 'Editar categoria' : 'Agregar categoria'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input
                value={catForm.name}
                onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Bebidas"
              />
            </div>
            <div className="space-y-1">
              <Label>Descripcion (opcional)</Label>
              <Input
                value={catForm.description}
                onChange={(e) => setCatForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Ej: Bebidas frias y calientes"
              />
            </div>
            <Button className="w-full" onClick={handleSaveCategory}>
              {catDialog?.mode === 'edit' ? 'Guardar cambios' : 'Crear categoria'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- item dialog --- */}
      <Dialog open={itemDialog !== null} onOpenChange={(open) => !open && setItemDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {itemDialog?.mode === 'edit' ? 'Editar producto' : 'Agregar producto'}
              {itemDialog?.mode === 'create' && (
                <span className="font-normal text-muted-foreground text-sm ml-2">
                  en {richCategories.find((c) => c.id === itemDialog.catId)?.name}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <ImageUpload
              value={itemForm.imageUrl}
              onChange={(url) => setItemForm((f) => ({ ...f, imageUrl: url }))}
              type="menu"
              label="Foto del producto"
              aspectRatio="square"
            />
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input
                value={itemForm.name}
                onChange={(e) => setItemForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Hamburguesa clasica"
              />
            </div>
            <div className="space-y-1">
              <Label>Precio base</Label>
              <MoneyInput
                value={itemForm.price}
                onChange={(v) => setItemForm((f) => ({ ...f, price: v }))}
                placeholder="15000"
                className="w-full"
              />
            </div>
            <div className="space-y-1">
              <Label>Descripcion (opcional)</Label>
              <Input
                value={itemForm.description}
                onChange={(e) => setItemForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Carne 150g, queso, lechuga..."
              />
            </div>
            <Button className="w-full" onClick={handleSaveItem}>
              {itemDialog?.mode === 'edit' ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- variant dialog --- */}
      <Dialog open={variantDialog !== null} onOpenChange={(open) => !open && setVariantDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {variantDialog?.mode === 'edit' ? 'Editar variante' : 'Agregar variante'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input
                value={variantForm.name}
                onChange={(e) => setVariantForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Grande"
              />
            </div>
            <div className="space-y-1">
              <Label>Precio (sobreescribe el base, opcional)</Label>
              <MoneyInput
                value={variantForm.price}
                onChange={(v) => setVariantForm((f) => ({ ...f, price: v }))}
                placeholder="20000"
                className="w-full"
              />
            </div>
            <Button className="w-full" onClick={handleSaveVariant}>
              {variantDialog?.mode === 'edit' ? 'Guardar cambios' : 'Crear variante'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- option dialog --- */}
      <Dialog open={optionDialog !== null} onOpenChange={(open) => !open && setOptionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {optionDialog?.mode === 'edit' ? 'Editar opcion' : 'Agregar opcion'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Grupo</Label>
              <Input
                value={optionForm.group}
                onChange={(e) => setOptionForm((f) => ({ ...f, group: e.target.value }))}
                placeholder="Extras, Salsas, Toppings..."
              />
            </div>
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input
                value={optionForm.name}
                onChange={(e) => setOptionForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Queso extra"
              />
            </div>
            <div className="space-y-1">
              <Label>Precio adicional (0 si no aplica)</Label>
              <MoneyInput
                value={optionForm.delta}
                onChange={(v) => setOptionForm((f) => ({ ...f, delta: v }))}
                placeholder="3000"
                className="w-full"
              />
            </div>
            <Button className="w-full" onClick={handleSaveOption}>
              {optionDialog?.mode === 'edit' ? 'Guardar cambios' : 'Crear opcion'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
