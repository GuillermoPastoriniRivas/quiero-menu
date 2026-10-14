'use client';

import { useEffect, useState, useCallback, useRef, Fragment } from 'react';
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
import { OptionEditorDialog } from '@/components/menu/option-editor-dialog';
import { SharedListEditorDialog } from '@/components/menu/shared-list-editor-dialog';
import { OptionGroupDialog } from '@/components/menu/option-group-dialog';
import { PromoComponentsDialog } from '@/components/menu/promo-components-dialog';
import { MenuMaintenance } from '@/components/menu/menu-maintenance';
import { editorGroupRows, sharedListUses, type EditorItem, type EditorCategory, type EditorVariant, type EditorMenu } from '@/components/menu/editor-model';
import Link from 'next/link';
import { describeOptionRule } from '@/lib/menu-options';
import { formatCurrency } from '@/lib/format';
import type { MenuItemOption } from '@/types';
import { toast } from 'sonner';

/* ---------- rich item type with nested data ---------- */
type RichItem = EditorItem;
type RichCategory = EditorCategory;

/* ---------- dialog states ---------- */
type CatDialog = { mode: 'create' } | { mode: 'edit'; cat: RichCategory } | null;
type ItemDialog = { mode: 'create'; catId: string } | { mode: 'edit'; item: RichItem } | null;
type VariantDialog = { mode: 'create'; itemId: string } | { mode: 'edit'; variant: EditorVariant } | null;
type OptionDialog = { mode: 'create'; item: RichItem } | { mode: 'edit'; option: MenuItemOption; item: RichItem } | null;
type GroupDialog = { item: RichItem; group: string; variantId?: string | null; groupId?: string } | null;
const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

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
    updateOption,
    deleteOption,
    updateItemOptionGroups,
    updateItemComponents,
  } = useMenuStore();

  const [richCategories, setRichCategories] = useState<RichCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuCurrency, setMenuCurrency] = useState('ARS');
  const [view, setView] = useState<'products' | 'lists' | 'prices' | 'availability'>('products');
  const [search, setSearch] = useState('');
  const [menuError, setMenuError] = useState('');
  const [dialogBusy, setDialogBusy] = useState(false);
  const [dialogError, setDialogError] = useState('');
  const dialogLock = useRef(false);
  const [optionalDetails, setOptionalDetails] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [promoEditor, setPromoEditor] = useState<RichItem | null>(null);
  const lastCategory = useRef('');
  const loadVersion = useRef(0);

  /* --- expanded state --- */
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  /* --- dialog state --- */
  const [listEditor, setListEditor] = useState<{ categoryId: string } | null>(null);
  const [catDialog, setCatDialog] = useState<CatDialog>(null);
  const [catForm, setCatForm] = useState({ name: '', description: '' });

  const [itemDialog, setItemDialog] = useState<ItemDialog>(null);
  const [itemForm, setItemForm] = useState({ name: '', price: '', description: '', imageUrl: '' });

  const [variantDialog, setVariantDialog] = useState<VariantDialog>(null);
  const [variantForm, setVariantForm] = useState({ name: '', price: '', isAvailable: true });

  const [optionDialog, setOptionDialog] = useState<OptionDialog>(null);

  const [groupDialog, setGroupDialog] = useState<GroupDialog>(null);

  /* --- inline price editing --- */
  const [priceEdit, setPriceEdit] = useState<
    { kind: 'item'; id: string } | { kind: 'variant'; id: string } | { kind: 'option'; id: string } | null
  >(null);
  const [priceDraft, setPriceDraft] = useState('');
  const cancelBlurRef = useRef(false);
  const appliedTarget = useRef('');

  /* ---------- authenticated menu includes hidden entries and stored/local data ---------- */
  const loadMenu = useCallback(async (showLoading = true) => {
    if (!user?.restaurantId) return;
    const version = ++loadVersion.current;
    if (showLoading) setLoading(true);
    try {
      const data = await api.get<EditorMenu>('/menu');
      if (version !== loadVersion.current) return;
      setMenuCurrency(data.restaurant?.currency ?? 'ARS');
      setRichCategories(data.categories);
      setMenuError('');
    } catch (cause) {
      if (version === loadVersion.current) setMenuError(cause instanceof Error ? cause.message : 'No se pudo cargar el menú');
    } finally {
      if (version === loadVersion.current) setLoading(false);
    }
  }, [user?.restaurantId]);

  useEffect(() => {
    loadMenu();
    return () => { loadVersion.current += 1; };
  }, [loadMenu]);

  // Dashboard shortcuts open the existing editor, including size/option controls.
  useEffect(() => {
    if (loading) return;
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('producto');
    const categoryId = params.get('categoria');
    const target = productId || categoryId;
    if (!target || appliedTarget.current === target) return;
    if (productId) {
      const category = richCategories.find((cat) => cat.items.some((item) => item.id === productId));
      const item = category?.items.find((product) => product.id === productId);
      if (!category || !item) return;
      appliedTarget.current = target;
      setExpandedCats((current) => new Set(current).add(category.id));
      setExpandedItems((current) => new Set(current).add(item.id));
      if (category.isOptionSource) { setView('lists'); setListEditor({ categoryId: category.id }); return; }
      setItemForm({ name: item.name, price: String(item.basePrice), description: item.description || '', imageUrl: item.imageUrl || '' });
      setItemDialog({ mode: 'edit', item });
      setOptionalDetails(false);
      setDialogError('');
    } else if (categoryId && richCategories.some((cat) => cat.id === categoryId)) {
      appliedTarget.current = target;
      setExpandedCats((current) => new Set(current).add(categoryId));
      if (richCategories.find((c) => c.id === categoryId)?.isOptionSource) { setView('lists'); setListEditor({ categoryId }); }
    }
  }, [loading, richCategories]);

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
    lastCategory.current = catId;
    setDialogError('');
    setOptionalDetails(false);
    setItemDialog({ mode: 'create', catId });
    setItemForm({ name: '', price: '', description: '', imageUrl: '' });
  };
  const openItemEdit = (item: RichItem) => {
    setDialogError('');
    setOptionalDetails(false);
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
    setDialogError('');
    setVariantForm({ name: '', price: '', isAvailable: true });
  };
  const openVariantEdit = (variant: EditorVariant) => {
    setDialogError('');
    setVariantDialog({ mode: 'edit', variant });
    setVariantForm({
      name: variant.name,
      price: String(variant.priceOverride ?? richCategories.flatMap((c) => c.items).find((i) => i.id === variant.itemId)?.basePrice ?? 0),
      isAvailable: variant.isAvailable !== false,
    });
  };

  const openOptionCreate = (item: RichItem) => {
    setOptionDialog({ mode: 'create', item });
  };
  const openOptionEdit = (option: MenuItemOption, item: RichItem) => {
    setOptionDialog({ mode: 'edit', option, item });

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
  const handleSaveItem = async (addAnother = false) => {
    if (!itemDialog || dialogLock.current || photoUploading) return;
    if (!itemForm.name.trim() || !/^\d+$/.test(itemForm.price) || !Number.isSafeInteger(Number(itemForm.price))) { setDialogError('Completá el nombre y un precio entero válido. Puede ser cero.'); return; }
    dialogLock.current = true;
    setDialogBusy(true);
    setDialogError('');
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
        let categoryId = itemDialog.catId;
        if (!categoryId) {
          const category = await createCategory({ name: 'Productos' });
          categoryId = category.id;
          lastCategory.current = categoryId;
          setItemDialog({ mode: 'create', catId: categoryId });
        }
        const created = await createItem({
          categoryId,
          ...payload,
          imageUrl: itemForm.imageUrl || undefined,
        });
        setExpandedCats((current) => new Set(current).add(categoryId));
        setExpandedItems((current) => new Set(current).add(created.id));
        toast.success('Producto creado');
      }
      if (addAnother && itemDialog.mode === 'create') {
        setItemForm({ name: '', price: '', description: '', imageUrl: '' });
        setOptionalDetails(false);
      } else setItemDialog(null);
      await loadMenu(false);
      return true;
    } catch (cause) {
      setDialogError(cause instanceof Error ? cause.message : 'No se pudo guardar. Conservamos lo que escribiste.');
      return false;
    } finally {
      dialogLock.current = false;
      setDialogBusy(false);
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
    if (!variantDialog || dialogLock.current) return;
    if (!variantForm.name.trim()) { setDialogError('La presentación necesita un nombre (por ejemplo, Chico o 1 Kg).'); return; }
    if (!/^\d+$/.test(variantForm.price) || !Number.isSafeInteger(Number(variantForm.price))) { setDialogError('Indicá el precio final de esta presentación. Puede ser cero.'); return; }
    dialogLock.current = true; setDialogBusy(true); setDialogError('');
    try {
      const payload = {
        name: variantForm.name.trim(),
        priceOverride: variantForm.price ? Number(variantForm.price) : null,
        isAvailable: variantForm.isAvailable,
      };
      if (variantDialog.mode === 'edit') {
        await updateVariant(variantDialog.variant.id, payload);
        toast.success('Variante actualizada');
      } else {
        await createVariant(variantDialog.itemId, payload);
        toast.success('Variante creada');
      }
      setVariantDialog(null);
      await loadMenu(false);
    } catch (cause) {
      setDialogError(cause instanceof Error ? cause.message : 'No se pudo guardar la presentación.');
    } finally {
      dialogLock.current = false; setDialogBusy(false);
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

  /* ---------- option group rules ---------- */
  const openGroupEdit = (item: RichItem, group: string, variantId?: string | null, groupId?: string) => setGroupDialog({ item, group, variantId, groupId });

  /* ---------- render ---------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <MaterialIcon name="progress_activity" size="lg" className="animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (menuError) return <div role="alert" className="space-y-3 rounded-2xl border p-5"><h1 className="text-xl font-bold">No pudimos actualizar tu carta</h1><p className="text-sm">{menuError}</p><Button onClick={() => void loadMenu()}>Volver a cargar</Button></div>;

  const productCategories = richCategories.filter((cat) => !cat.isOptionSource);
  const optionLists = richCategories.filter((cat) => cat.isOptionSource);
  const filteredProducts = productCategories.map((cat) => ({ ...cat, items: cat.items.filter((item) => !search || normalize(`${cat.name} ${item.name} ${item.description} ${item.variants.map((v) => v.name).join(' ')} ${[...item.options, ...(item.resolvedOptions ?? [])].map((o) => o.name).join(' ')}`).includes(normalize(search))) })).filter((cat) => !search || cat.items.length > 0);

  // Un producto con tamaños no tiene "precio de arriba": el precio vive en cada presentación.
  const dialogItemId = itemDialog?.mode === 'edit' ? itemDialog.item.id : null;
  const dialogItem = dialogItemId ? richCategories.flatMap((cat) => cat.items).find((item) => item.id === dialogItemId) ?? null : null;
  const dialogVariants = dialogItem ? [...dialogItem.variants].sort((a, b) => a.displayOrder - b.displayOrder) : [];

  // Los sabores de una lista compartida se administran una sola vez en su lista:
  // desde acá solo se prende/apaga para este local.
  const handleToggleSourceOption = async (sourceItemId: string, next: boolean) => {
    try {
      await toggleAvailability(sourceItemId);
      await loadMenu(false);
    } catch {
      toast.error(next ? 'No se pudo habilitar el sabor' : 'No se pudo marcar como agotado');
    }
  };

  return (
    <div className="min-w-0 w-full space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-6">
        <div className="min-w-0">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-on-background" style={{ fontFamily: 'var(--font-heading)' }}>Menú</h1>
          <p className="text-on-surface-variant text-lg">Sumá un producto, cambiá un precio o marcá algo como agotado.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/onboarding?from=menu" className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 text-sm font-bold text-on-surface transition-colors hover:border-primary/40"><MaterialIcon name="auto_awesome" size="xs" />Importar con IA</Link>
          <button type="button" onClick={() => { setView('products'); openItemCreate(productCategories.find((c) => c.id === lastCategory.current)?.id ?? productCategories[0]?.id ?? ''); }} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl gradient-cta px-4 text-sm font-bold text-white shadow-md shadow-primary/20 sm:w-auto"><MaterialIcon name="add" size="md" />Agregar producto</button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="sticky top-2 z-20 rounded-2xl border border-primary/15 bg-surface-container p-1 shadow-sm" role="group" aria-label="Vista de la carta">
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
            {([{ key: 'products', label: 'Productos' }, { key: 'lists', label: 'Listas compartidas' }, { key: 'prices', label: 'Precios' }, { key: 'availability', label: 'Disponibilidad' }] as const).map((tab) => <button type="button" key={tab.key} aria-pressed={view === tab.key} onClick={() => setView(tab.key)} className={`min-h-11 rounded-lg px-2 text-sm font-bold transition-colors ${view === tab.key ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>{tab.label}</button>)}
          </div>
        </div>
      {view === 'products' && <div className="relative">
        <MaterialIcon name="search" size="sm" className="pointer-events-none absolute left-3 top-3.5 text-on-surface-variant" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Buscar en toda la carta" placeholder="Buscá un producto, presentación o sabor…" className="h-11 rounded-xl pl-10" />
      </div>}
      {(view === 'prices' || view === 'availability') && <MenuMaintenance categories={richCategories} view={view} search={search} onChanged={() => loadMenu(false)} onEdit={(entry) => {
        const category = richCategories.find((c) => c.id === entry.categoryId);
        const item = category?.items.find((i) => i.id === entry.itemId);
        if (!item || !category) return;
        if (entry.shared) setListEditor({ categoryId: category.id });
        else if (entry.kind === 'variant') { const variant = item.variants.find((v) => v.id === entry.id); if (variant) openVariantEdit(variant); }
        else if (entry.kind === 'option') { const option = item.options.find((o) => o.id === entry.id); if (option) openOptionEdit(option, item); }
        else openItemEdit(item);
      }} />}
      {view === 'lists' && <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Sabores, salsas y extras compartidos</h2><p className="mt-1 text-sm text-muted-foreground">Se eligen dentro de tus productos. Editalos una vez y el cambio llega a todos sus usos.</p></div><Button variant="outline" onClick={() => setListEditor({ categoryId: '' })}><MaterialIcon name="add" size="sm" />Crear lista</Button></div>
        {optionLists.filter((list) => !search || normalize(`${list.name} ${list.items.map((i) => i.name).join(' ')}`).includes(normalize(search))).map((list) => {
          const uses = sharedListUses(richCategories, list.id);
          return (
            <Card key={list.id} className="gap-4 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-bold text-on-surface">
                    {list.name}
                    {!list.isVisible && <Badge variant="secondary" className="ml-2">Oculta como catálogo</Badge>}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {list.items.length} opciones · {uses.length} usos. Los recargos se ajustan por producto desde Reglas.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setListEditor({ categoryId: list.id })}>
                  <MaterialIcon name="edit" size="xs" className="mr-1" />
                  Editar lista
                </Button>
              </div>

              <ul className="space-y-1.5">
                {list.items.filter((o) => !search || normalize(`${list.name} ${o.name}`).includes(normalize(search))).map((o) => (
                  <li key={o.id}>
                    <label className="flex min-h-11 w-full items-center gap-3 rounded-xl bg-muted/60 px-3 text-sm">
                      <span className="min-w-0 flex-1 truncate font-medium text-on-surface">{o.name}</span>
                      <span className={`shrink-0 text-xs font-semibold ${o.isAvailable ? 'text-muted-foreground' : 'text-error'}`}>
                        {o.isAvailable ? 'Disponible' : 'Agotado'}
                      </span>
                      <Switch
                        aria-label={`Disponibilidad de ${o.name} en ${list.name}`}
                        checked={o.isAvailable}
                        onCheckedChange={(next) => void handleToggleSourceOption(o.id, next)}
                      />
                    </label>
                  </li>
                ))}
              </ul>

              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Dónde se usa</p>
                {uses.length ? (
                  <ul className="space-y-1.5">
                    {uses.map(({ item, group }, index) => (
                      <li key={`${item.id}-${index}`}>
                        <button
                          type="button"
                          className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-outline-variant/30 px-3 py-2 text-left transition-colors hover:border-primary/40 hover:bg-muted/50"
                          onClick={() => {
                            setView('products');
                            setExpandedCats((current) => new Set(current).add(item.categoryId));
                            setExpandedItems((current) => new Set(current).add(item.id));
                            openGroupEdit(item, group.name, group.variantId, group.groupId);
                          }}
                        >
                          <MaterialIcon name="restaurant_menu" size="sm" className="shrink-0 text-primary" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-on-surface">{item.name}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {group.variantId ? item.variants.find((v) => v.id === group.variantId)?.name ?? 'Presentación pendiente' : 'Todas las presentaciones'} · {group.name}
                            </span>
                          </span>
                          <MaterialIcon name="chevron_right" size="sm" className="shrink-0 text-muted-foreground" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Todavía no se usa. Vinculala desde un producto → Agregar sabores o extras → Lista compartida.
                  </p>
                )}
              </div>
            </Card>
          );
        })}
        {optionLists.length === 0 && <p className="py-8 text-center text-muted-foreground">Creá tu primera lista o hacelo al configurar un producto.</p>}
      </section>}

      {/* ---- add category ---- */}
      {view === 'products' && <button
        type="button"
        onClick={openCatCreate}
        className="flex w-full min-w-0 items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/30 px-4 py-3 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
          <MaterialIcon name="category" size="sm" />
        </span>
        <span className="font-medium text-sm sm:text-[15px] truncate">Agregar categoría</span>
        <MaterialIcon name="add_circle" className="ml-auto shrink-0 text-foreground/60" size="sm" />
      </button>}

      {/* ---- categorías de productos + listas de opciones ---- */}
      {(view === 'products' ? [{ key: 'product', cats: filteredProducts }] : []).map((group) =>
        group.cats.length === 0 ? null : (
          <Fragment key={group.key}>
            {group.key === 'list' && (
              <div className="pt-2">
                <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold text-on-surface">Listas de opciones</h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                  No se venden por separado: se eligen dentro de un producto (por ejemplo, los sabores).
                </p>
              </div>
            )}
            {group.cats.map((cat) => {
        const catOpen = expandedCats.has(cat.id) || Boolean(search);
        const catMin = cat.items.length ? Math.min(...cat.items.map((i) => i.variants.length ? Math.min(...i.variants.map((v) => v.priceOverride ?? i.basePrice)) : i.basePrice)) : null;
        return (
          <Card key={cat.id} className="min-w-0 gap-0 overflow-hidden p-0">
            <CardHeader
              className="flex flex-row items-center justify-between gap-3 cursor-pointer select-none min-w-0 px-3 py-2.5 sm:px-4 transition-colors hover:bg-surface-container-low"
              onClick={() => toggleCat(cat.id)}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="shrink-0 text-muted-foreground">
                  {catOpen ? <MaterialIcon name="expand_more" size="sm" /> : <MaterialIcon name="chevron_right" size="sm" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <CardTitle className="text-[15px] sm:text-lg truncate min-w-0 font-semibold">{cat.name}</CardTitle>
                    <Badge variant="outline" className="shrink-0 text-[11px] font-medium px-2 py-0">{cat.items.length} productos</Badge>
                  </div>
                  {!catOpen && cat.items.length > 0 && <p className="mt-0.5 truncate text-xs text-on-surface-variant">{cat.items.slice(0, 3).map((item) => item.name).join(' · ')}{cat.items.length > 3 ? ' · …' : ''}{catMin !== null ? ` — Desde ${formatCurrency(catMin, menuCurrency)}` : ''}</p>}
                </div>
              </div>
              <div className="flex gap-0.5 sm:gap-1 shrink-0 items-center" onClick={(e) => e.stopPropagation()}>
                <Button size="icon-sm" variant="ghost" className="h-8 w-8" onClick={() => openCatEdit(cat)} aria-label="Editar categoría">
                  <MaterialIcon name="edit" size="sm" />
                </Button>
                <Button size="icon-sm" variant="ghost" className="h-8 w-8" onClick={() => handleDeleteCategory(cat.id)} aria-label="Eliminar categoría">
                  <MaterialIcon name="delete" size="sm" className="text-destructive" />
                </Button>
              </div>
            </CardHeader>

            {catOpen && (
              <CardContent className="space-y-2 pt-0 pb-4">
                {cat.items.length === 0 && (
                  <p className="text-sm text-muted-foreground py-2">Sin productos en esta categoria.</p>
                )}

                {cat.items.map((item) => {
                   const itemOpen = expandedItems.has(item.id);
                  const hasExtras = item.variants.length > 0 || item.options.length > 0 || (item.optionGroups?.length ?? 0) > 0;

                  return (
                    <div key={item.id} className="border rounded-lg">
                      {/* item header */}
                      <div
                        className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between px-3 sm:px-4 py-3 cursor-pointer select-none sm:gap-3 min-w-0"
                        onClick={() => toggleItem(item.id)}
                      >
                        <button type="button" aria-expanded={itemOpen} onClick={(event) => { event.stopPropagation(); toggleItem(item.id); }} className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 text-left">
                          <span className="shrink-0 text-muted-foreground">
                            {hasExtras ? (
                              itemOpen ? <MaterialIcon name="expand_more" size="sm" /> : <MaterialIcon name="chevron_right" size="sm" />
                            ) : (
                              <MaterialIcon name="inventory_2" size="sm" />
                            )}
                          </span>
                          {item.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.imageUrl} alt="" className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg object-cover shrink-0" />
                          ) : (
                            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-muted shrink-0">
                              <MaterialIcon name="restaurant" size="sm" className="text-muted-foreground" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <span className="font-medium text-[14px] sm:text-[15px] truncate block">{item.name}</span>
                            {item.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                            )}
                          </div>
                        </button>

                        <div className="flex items-center gap-1 sm:gap-2 shrink-0 flex-wrap justify-end w-full sm:w-auto" onClick={(e) => e.stopPropagation()}>
                             {item.variants.length > 0 ? (
                               <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                 {[...item.variants].sort((a, b) => a.displayOrder - b.displayOrder).map((v) =>
                                   priceEdit?.kind === 'variant' && priceEdit.id === v.id ? (
                                     <MoneyInput
                                       key={v.id}
                                       autoFocus
                                       value={priceDraft}
                                       onChange={setPriceDraft}
                                       onKeyDown={handlePriceKeyDown}
                                       onBlur={handlePriceBlur}
                                       className="w-24"
                                       aria-label={`Precio de ${v.name || 'presentación'} en ${item.name}`}
                                     />
                                   ) : (
                                     <button
                                       key={v.id}
                                       type="button"
                                       onClick={() => openPriceEdit({ kind: 'variant', id: v.id }, v.priceOverride != null ? String(v.priceOverride) : '')}
                                       className="whitespace-nowrap rounded px-1.5 py-0.5 text-sm transition-colors hover:bg-muted"
                                       title={`Editar precio de ${v.name || 'presentación'}`}
                                     >
                                       {v.name && <span className="mr-1 text-xs text-muted-foreground">{v.name}</span>}
                                       <span className="font-semibold">{formatCurrency(v.priceOverride ?? item.basePrice, menuCurrency)}</span>
                                     </button>
                                   ),
                                 )}
                               </div>
                             ) : priceEdit?.kind === 'item' && priceEdit.id === item.id ? (
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
                              {formatCurrency(item.basePrice, menuCurrency)}
                            </button>
                          )}
                           {!item.isVisible && <Badge variant="outline">Oculto</Badge>}
                           {item.variants.length === 0 && item.basePrice === 0 && <Badge variant="outline" className="text-amber-700">Precio de venta en cero</Badge>}
                           {!item.isAvailable && <Badge variant="secondary">Agotado</Badge>}
                          <Switch
                            aria-label={`Disponibilidad de ${item.name}`}
                            checked={item.isAvailable}
                            onCheckedChange={(checked) => handleToggleAvailability(item.id, checked)}
                          />
                          <Button size="sm" variant="ghost" aria-label={`Editar ${item.name}`} onClick={() => openItemEdit(item)}>
                            <MaterialIcon name="edit" size="xs" />
                          </Button>
                          <Button size="sm" variant="ghost" aria-label={`Eliminar ${item.name}`} onClick={() => handleDeleteItem(item.id)}>
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
                               <span className="text-sm font-medium">Presentaciones · nombre, precio y disponibilidad</span>
                              <Badge variant="outline" className="text-xs">{item.variants.length}</Badge>
                            </div>

                            {item.variants.length === 0 && (
                              <p className="text-xs text-muted-foreground pl-6">Sin variantes.</p>
                            )}

                            {item.variants.map((v) => (
                              <div key={v.id} className="flex items-center justify-between pl-6 py-1.5 border-l-2 border-muted ml-2">
                                <div className="pl-2 flex items-center gap-1">
                                 <span className={`text-sm ${!v.name.trim() ? 'text-amber-700' : ''}`}>{v.name || 'Presentación sin nombre'}</span>
                                 {(v.priceOverride ?? item.basePrice) === 0 && <span className="text-[11px] text-amber-700">Precio en cero</span>}
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
                                          {formatCurrency(v.priceOverride, menuCurrency)}
                                        </span>
                                      ) : (
                                        <MaterialIcon name="payments" size="xs" className="text-muted-foreground/60" />
                                      )}
                                    </button>
                                  )}
                                </div>
                                <div className="flex gap-1">
                                  <Switch aria-label={`Disponibilidad de ${v.name || 'presentación sin nombre'} en ${item.name}`} checked={v.isAvailable !== false} onCheckedChange={async (next) => { try { await updateVariant(v.id, { isAvailable: next }); await loadMenu(false); } catch (cause) { toast.error(cause instanceof Error ? cause.message : 'No se pudo cambiar la presentación'); } }} />
                                  <Button size="sm" variant="ghost" aria-label={`Editar tamaño ${v.name}`} onClick={() => openVariantEdit(v)}>
                                    <MaterialIcon name="edit" size="xs" />
                                  </Button>
                                  <Button size="sm" variant="ghost" aria-label={`Eliminar tamaño ${v.name}`} onClick={() => handleDeleteVariant(v.id)}>
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
                               <span className="text-sm">Agregar presentación</span>
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

                            {editorGroupRows(item).length === 0 && (
                              <p className="text-xs text-muted-foreground pl-6">Sin opciones.</p>
                            )}

                            {editorGroupRows(item).map(({ key, rule, options }) => {
                              const source = optionLists.find((list) => list.id === rule.sourceCategoryId);
                              return <div key={key} className="space-y-2 rounded-xl border p-3">
                                <div className="flex flex-wrap items-center gap-2"><MaterialIcon name={rule.sourceCategoryId ? 'layers' : 'tune'} size="xs" /><span className="font-semibold text-sm">{rule.name}</span><Badge variant="secondary">{describeOptionRule(rule.minSelections, rule.maxSelections)}</Badge><span className="text-xs text-muted-foreground">{rule.variantId ? item.variants.find((v) => v.id === rule.variantId)?.name ?? 'Presentación pendiente' : 'Regla general · todas las presentaciones'}</span><Button size="sm" variant="outline" onClick={() => openGroupEdit(item, rule.name, rule.variantId, rule.groupId)}>Reglas</Button></div>
                                {rule.selectionMode === 'quantities' && <p className="text-xs text-primary">Pack de {rule.requiredTotal} unidades · min/max cuentan variedades distintas</p>}
                                {rule.sourceCategoryId ? <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-muted-foreground">Lista: {source?.name ?? 'Fuente eliminada o no disponible'} · {source?.items.length ?? 0} opciones. Nombre y agotados se administran una sola vez.</p>{source && <Button size="sm" variant="outline" onClick={() => setListEditor({ categoryId: source.id })}>Editar lista</Button>}</div> : <>
                                  {options.length === 0 && <p className="text-xs text-muted-foreground">Este grupo todavía no tiene opciones. Agregalas para que el cliente pueda elegir.</p>}
                                  {options.map((opt) => <div key={opt.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/40 p-2"><div className="min-w-0"><span className="text-sm font-medium">{opt.name}</span>{opt.description && <p className="text-xs text-muted-foreground">{opt.description}</p>}<span className="block text-xs text-muted-foreground">{opt.priceDelta ? `Adicional: ${formatCurrency(opt.priceDelta, menuCurrency)}` : 'Incluida sin adicional'}</span></div><div className="flex items-center gap-2"><label className="flex min-h-10 items-center gap-2 text-xs">{opt.isAvailable ? 'Disponible' : 'Agotada'}<Switch aria-label={`Disponibilidad de ${opt.name} en ${item.name}`} checked={opt.isAvailable} onCheckedChange={async (next) => { try { await updateOption(opt.id, { isAvailable: next }); await loadMenu(false); } catch (cause) { toast.error(cause instanceof Error ? cause.message : 'No se pudo actualizar la opción'); } }} /></label><Button size="icon-sm" variant="ghost" aria-label={`Editar opción ${opt.name}`} onClick={() => openOptionEdit(opt, item)}><MaterialIcon name="edit" size="xs" /></Button><Button size="icon-sm" variant="ghost" aria-label={`Eliminar opción ${opt.name}`} onClick={() => handleDeleteOption(opt.id)}><MaterialIcon name="delete" size="xs" /></Button></div></div>)}
                                </>}
                              </div>;
                            })}

                            {/* add option (looks like an option row) */}
                            <button
                              type="button"
                              onClick={() => openOptionCreate(item)}
                              className="ml-2 flex w-full items-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 px-2 py-1.5 pl-6 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted"
                            >
                              <MaterialIcon name="add" size="xs" />
                              <span className="text-sm">Agregar sabores o extras</span>
                            </button>
                            {richCategories.some((source) => source.isOptionSource && source.id !== item.categoryId) && <p className="mt-2 ml-2 text-xs text-muted-foreground">¿Repetís estos sabores en otros productos? Usá <strong>Agregar opciones → Lista compartida</strong>.</p>}
                            <Button type="button" variant="ghost" size="sm" onClick={() => openGroupEdit(item, '', null)}>Agregar grupo de elecciones / pack</Button>
                          </div>
                          <Separator />
                          <div className="space-y-2"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">Componentes de promo</h3><Button variant="outline" size="sm" onClick={() => setPromoEditor(item)}>{item.components?.length ? 'Editar componentes' : 'Configurar promo'}</Button></div><p className="text-xs text-muted-foreground">Precio de la promo en el producto/presentación; elecciones y adicionales independientes por componente.</p>{item.components?.map((slot) => <p key={slot.slotId} className="text-sm">{slot.quantity} × {slot.name} · {slot.choices.length} elecciones · {slot.parentVariantId ? item.variants.find((v) => v.id === slot.parentVariantId)?.name ?? 'Presentación pendiente' : 'todas las presentaciones'}</p>)}</div>
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
          </Fragment>
        ),
      )}

      {view === 'products' && filteredProducts.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          {search ? 'No encontramos ese producto. Probá otra búsqueda.' : 'Empezá con un nombre y un precio. Podés organizar las categorías después.'}
        </p>
      )}

      {/* ============== DIALOGS ============== */}

      </div>

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
      <Dialog open={itemDialog !== null} onOpenChange={(open) => { if (!open && !dialogLock.current && !photoUploading) setItemDialog(null); }}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
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
          <fieldset disabled={dialogBusy} className="space-y-3 disabled:opacity-60">
            {itemDialog?.mode === 'create' && <label className="block space-y-1 text-sm">Categoría<select aria-label="Categoría del producto" value={itemDialog.catId} onChange={(e) => { lastCategory.current = e.target.value; setItemDialog({ mode: 'create', catId: e.target.value }); }} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm">{productCategories.length === 0 && <option value="">Productos (podés organizar después)</option>}{productCategories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select></label>}
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input
                value={itemForm.name}
                onChange={(e) => setItemForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Hamburguesa clasica"
              />
            </div>
            {itemDialog?.mode === 'edit' && dialogVariants.length > 0 ? (
              <div className="space-y-2 rounded-xl bg-muted p-3">
                <p className="text-sm font-semibold">Precios por tamaño · {menuCurrency}</p>
                {dialogVariants.map((v) =>
                  priceEdit?.kind === 'variant' && priceEdit.id === v.id ? (
                    <MoneyInput
                      key={v.id}
                      autoFocus
                      value={priceDraft}
                      onChange={setPriceDraft}
                      onKeyDown={handlePriceKeyDown}
                      onBlur={handlePriceBlur}
                      className="w-28"
                      aria-label={`Precio de ${v.name || 'presentación'}`}
                    />
                  ) : (
                    <div key={v.id} className="flex items-center justify-between gap-2">
                      <span className="min-w-0 flex-1 truncate text-sm">{v.name || 'Presentación sin nombre'}</span>
                      <button
                        type="button"
                        onClick={() => openPriceEdit({ kind: 'variant', id: v.id }, v.priceOverride != null ? String(v.priceOverride) : '')}
                        className="whitespace-nowrap rounded px-1.5 py-0.5 text-sm font-semibold transition-colors hover:bg-background"
                        title="Editar precio"
                      >
                        {formatCurrency(v.priceOverride ?? (dialogItem?.basePrice ?? 0), menuCurrency)}
                      </button>
                    </div>
                  ),
                )}
                <p className="text-xs text-muted-foreground">Tocá un precio para editarlo. Para agregar o quitar tamaños, usá la sección Presentaciones del producto.</p>
              </div>
            ) : <div className="space-y-1">
              <Label>Precio de venta · {menuCurrency}</Label>
              <MoneyInput
                value={itemForm.price}
                onChange={(v) => setItemForm((f) => ({ ...f, price: v }))}
                placeholder="15000"
                className="w-full"
              />
            </div>}
            {itemForm.price === '0' && (itemDialog?.mode !== 'edit' || itemDialog.item.variants.length === 0) && <p role="status" className="text-xs text-amber-700">Este producto se publicará con precio de venta cero. No es una opción incluida gratis.</p>}
            <button type="button" aria-expanded={optionalDetails} onClick={() => setOptionalDetails(!optionalDetails)} className="min-h-11 text-sm font-semibold text-primary">{optionalDetails ? 'Ocultar detalles opcionales' : 'Sumar foto y descripción (opcional)'}</button>
            {optionalDetails && <div className="space-y-3"><ImageUpload value={itemForm.imageUrl} onChange={(url) => setItemForm((f) => ({ ...f, imageUrl: url }))} onUploadingChange={setPhotoUploading} type="menu" label="Foto del producto" aspectRatio="square" /><div className="space-y-1">
              <Label>Descripcion (opcional)</Label>
              <Input
                value={itemForm.description}
                onChange={(e) => setItemForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Carne 150g, queso, lechuga..."
              />
            </div></div>}
            {dialogError && <p role="alert" className="text-sm text-destructive">{dialogError}</p>}
            <Button className="w-full" disabled={dialogBusy || photoUploading} onClick={() => void handleSaveItem()}>
              {photoUploading ? 'Esperando la foto…' : dialogBusy ? 'Guardando…' : itemDialog?.mode === 'edit' ? 'Guardar cambios' : 'Guardar producto'}
            </Button>
            {itemDialog?.mode === 'create' && <Button className="w-full" variant="outline" disabled={dialogBusy || photoUploading} onClick={() => void handleSaveItem(true)}>Guardar y agregar otro</Button>}
            {itemDialog?.mode === 'edit' && <Button className="w-full" variant="outline" disabled={dialogBusy || photoUploading} onClick={async () => {
              const item = itemDialog.item;
              if (await handleSaveItem()) { setView('products'); setSearch(''); setExpandedCats((current) => new Set(current).add(item.categoryId)); setExpandedItems((current) => new Set(current).add(item.id)); }
            }}>Guardar y configurar presentaciones, elecciones o promo</Button>}
            <p className="text-xs text-muted-foreground">Nombre y precio alcanzan para empezar. Las elecciones se configuran después, sin duplicar el producto.</p>
          </fieldset>
        </DialogContent>
      </Dialog>

      {/* --- variant dialog --- */}
      <Dialog open={variantDialog !== null} onOpenChange={(open) => { if (!open && !dialogLock.current) setVariantDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {variantDialog?.mode === 'edit' ? 'Editar presentación' : 'Agregar presentación'}
            </DialogTitle>
          </DialogHeader>
          <fieldset disabled={dialogBusy} className="space-y-3 disabled:opacity-60">
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input
                value={variantForm.name}
                onChange={(e) => setVariantForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Grande"
              />
            </div>
            <div className="space-y-1">
              <Label>Precio final de esta presentación · {menuCurrency}</Label>
              <MoneyInput
                value={variantForm.price}
                onChange={(v) => setVariantForm((f) => ({ ...f, price: v }))}
                placeholder="20000"
                className="w-full"
              />
            </div>
            {variantForm.price === '0' && <p role="status" className="text-xs text-amber-700">Esta presentación se venderá con precio cero.</p>}
            <label className="flex min-h-11 items-center justify-between gap-2 text-sm">{variantForm.isAvailable ? 'Disponible para vender' : 'Agotada'}<Switch aria-label="Disponibilidad de la presentación" checked={variantForm.isAvailable} onCheckedChange={(isAvailable) => setVariantForm((f) => ({ ...f, isAvailable }))} /></label>
            {dialogError && <p role="alert" className="text-sm text-destructive">{dialogError}</p>}
            <Button className="w-full" disabled={dialogBusy} onClick={handleSaveVariant}>
              {dialogBusy ? 'Guardando…' : variantDialog?.mode === 'edit' ? 'Guardar cambios' : 'Crear presentación'}
            </Button>
          </fieldset>
        </DialogContent>
      </Dialog>

      {optionDialog && (
        <OptionEditorDialog
          dialog={optionDialog}
          sources={richCategories
            .filter((cat) => cat.isOptionSource && (optionDialog.mode !== 'create' || cat.id !== optionDialog.item.categoryId))
            .map((cat) => ({
              id: cat.id,
              name: cat.name,
              items: cat.items.map((i) => ({ id: i.id, name: i.name, isAvailable: i.isAvailable })),
            }))}
          onClose={() => setOptionDialog(null)}
          onChanged={() => loadMenu(false)}
        />
      )}
      {groupDialog && <OptionGroupDialog item={groupDialog.item} group={groupDialog.group} groupId={groupDialog.groupId} initialVariantId={groupDialog.variantId} sources={richCategories.filter((c) => c.isOptionSource && c.id !== groupDialog.item.categoryId)} onClose={() => setGroupDialog(null)} onSave={async (groups) => {
        await updateItemOptionGroups(groupDialog.item.id, groups);
        await loadMenu(false);
        toast.success('Regla del grupo guardada');
      }} />}
      {listEditor && (
        <SharedListEditorDialog
          list={optionLists.find((cat) => cat.id === listEditor.categoryId) ?? null}
          onClose={() => setListEditor(null)}
          onChanged={() => loadMenu(false)}
          uses={sharedListUses(richCategories, listEditor.categoryId).map(({ item, group }) => ({ name: `${item.name} · ${group.variantId ? item.variants.find((v) => v.id === group.variantId)?.name ?? 'Presentación pendiente' : 'todas las presentaciones'} · ${group.name}`, href: `/menu?producto=${encodeURIComponent(item.id)}` }))}
        />
      )}
      {promoEditor && <PromoComponentsDialog item={promoEditor} categories={richCategories} onClose={() => setPromoEditor(null)} onSave={async (components) => { await updateItemComponents(promoEditor.id, components); await loadMenu(false); toast.success('Componentes guardados'); }} />}

    </div>
  );
}
