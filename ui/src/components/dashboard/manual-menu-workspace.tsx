'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import { canEditBasePrice, manualEntries, priceChanges, savePriceChanges, type ManualCategory } from '@/lib/manual-menu';
import { MaterialIcon } from '@/components/ui/material-icon';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { ImageUpload } from '@/components/ui/image-upload';
import type { MenuCategory, MenuItem, StorefrontData } from '@/types';

type View = 'products' | 'prices' | 'availability';
const VIEWS: { key: View; label: string; icon: string }[] = [
  { key: 'products', label: 'Productos', icon: 'restaurant_menu' },
  { key: 'prices', label: 'Precios', icon: 'payments' },
  { key: 'availability', label: 'Disponibilidad', icon: 'check_circle' },
];
const NEW_CATEGORY = '__new__';
const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const actionClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

export function ManualMenuWorkspace({ data, loading, error, onChanged }: {
  data: StorefrontData | null;
  loading: boolean;
  error: string | null;
  onChanged: () => Promise<void>;
}) {
  const router = useRouter();
  const nameRef = useRef<HTMLInputElement>(null);
  const lockRef = useRef(false);
  const [view, setView] = useState<View>('products');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [adding, setAdding] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [details, setDetails] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const categories: ManualCategory[] = data?.categories ?? [];
  const entries = manualEntries(categories);
  const products = entries.filter(({ category }) => !category.isOptionSource);
  const sourceCategories = categories.filter((category) => category.isOptionSource);
  const currency = data?.restaurant?.currency ?? 'ARS';
  const resolvedCategoryId = categoryId || categories.find((category) => !category.isOptionSource)?.id || categories[0]?.id || NEW_CATEGORY;
  const selectedSource = categories.find((category) => category.id === resolvedCategoryId)?.isOptionSource;
  const filtered = entries.filter(({ category, item }) =>
    (filter === 'all' || category.id === filter) && normalize(`${item.name} ${category.name}`).includes(normalize(search)),
  );
  const visible = filtered.slice(0, 6);
  const dirtyCount = entries.filter((entry) => canEditBasePrice(entry) && drafts[entry.item.id] !== undefined && drafts[entry.item.id] !== String(entry.item.basePrice)).length;
  const availableCount = products.filter(({ item }) => item.isAvailable).length;

  const beginAdding = () => {
    setAdding(true);
    setFeedback(null);
    if (filter !== 'all') setCategoryId(filter);
    requestAnimationFrame(() => nameRef.current?.focus());
  };

  const addProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (lockRef.current || photoUploading || !data || error) return;
    if (!name.trim() || (!selectedSource && !/^\d+$/.test(price)) || !Number.isSafeInteger(Number(price || '0'))) {
      setFeedback('Completá el nombre y un precio válido. El precio puede ser cero.');
      return;
    }
    if (resolvedCategoryId === NEW_CATEGORY && !newCategory.trim()) {
      setFeedback('Dale un nombre a la categoría.');
      return;
    }
    lockRef.current = true;
    setBusy('create');
    setFeedback(null);
    try {
      let targetCategory = resolvedCategoryId;
      if (targetCategory === NEW_CATEGORY) {
        const created = await api.post<MenuCategory>('/menu/categories', { name: newCategory.trim() });
        targetCategory = created.id;
        // Keep this ID if item creation fails, so retry doesn't create another category.
        setCategoryId(created.id);
        setNewCategory('');
      }
      const created = await api.post<MenuItem>('/menu/items', {
        categoryId: targetCategory,
        name: name.trim(),
        basePrice: selectedSource ? 0 : Number(price),
        description: description.trim(),
        imageUrl,
      });
      toast.success(`${created.name} guardado`, {
        action: { label: selectedSource ? 'Editar lista' : 'Editar detalles', onClick: () => router.push(selectedSource ? `/menu?categoria=${encodeURIComponent(targetCategory)}` : `/menu?producto=${encodeURIComponent(created.id)}`) },
      });
      setName('');
      setPrice('');
      setDescription('');
      setImageUrl('');
      setDetails(false);
      setFeedback('Guardado. Podés cargar el siguiente en la misma categoría.');
    } catch (cause) {
      setFeedback(cause instanceof Error ? cause.message : 'No se pudo guardar. Conservamos lo que escribiste.');
    } finally {
      await onChanged();
      lockRef.current = false;
      setBusy(null);
      requestAnimationFrame(() => nameRef.current?.focus());
    }
  };

  const savePrices = async () => {
    if (lockRef.current) return;
    let changes;
    try {
      changes = priceChanges(entries, drafts);
    } catch (cause) {
      setFeedback(cause instanceof Error ? cause.message : 'Revisá los precios.');
      return;
    }
    if (!changes.length) return;
    lockRef.current = true;
    setBusy('prices');
    setFeedback(null);
    try {
      const result = await savePriceChanges(changes, async (change) => {
        await api.patch<MenuItem>(`/menu/items/${change.id}`, { basePrice: change.basePrice });
      });
      setDrafts((current) => {
        const next = { ...current };
        result.saved.forEach((change) => delete next[change.id]);
        return next;
      });
      if (result.failed.length) {
        setFeedback(`${result.saved.length} guardados. Pendientes: ${result.failed.map(({ change }) => change.name).join(', ')}. Conservamos esos precios para reintentar.`);
      } else {
        toast.success(`${result.saved.length} ${result.saved.length === 1 ? 'precio actualizado' : 'precios actualizados'}`);
      }
      await onChanged();
    } finally {
      lockRef.current = false;
      setBusy(null);
    }
  };

  const changeAvailability = async (item: MenuItem) => {
    if (lockRef.current) return;
    lockRef.current = true;
    setBusy(item.id);
    setFeedback(null);
    try {
      const updated = await api.patch<MenuItem>(`/menu/items/${item.id}/toggle-availability`, {});
      toast.success(`${item.name}: ${updated.isAvailable ? 'disponible' : 'agotado'}`);
      await onChanged();
    } catch (cause) {
      setFeedback(cause instanceof Error ? cause.message : 'No se pudo cambiar la disponibilidad.');
    } finally {
      lockRef.current = false;
      setBusy(null);
    }
  };

  return (
    <section aria-labelledby="manual-menu-title" className="overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm">
      <div className="border-b border-outline-variant/25 bg-gradient-to-br from-primary/[0.07] via-surface-container-lowest to-surface-container-lowest p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 id="manual-menu-title" className="font-[family-name:var(--font-heading)] text-2xl font-extrabold tracking-tight text-on-surface sm:text-3xl">Gestioná tu carta</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-on-surface-variant">Sumá un producto, cambiá un precio o marcá algo como agotado.</p>
          </div>
          <button type="button" disabled={!data || Boolean(busy) || Boolean(error)} onClick={beginAdding} className={cn(actionClass, 'w-full gradient-cta text-white shadow-md shadow-primary/20 sm:w-auto')}>
            <MaterialIcon name="add" size="md" />{sourceCategories.some((category) => category.id === filter) ? 'Agregar opción' : 'Agregar producto'}
          </button>
        </div>
        {data && <dl className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-outline-variant/25 pt-4">
          <div className="flex items-baseline gap-1.5"><dt className="text-sm text-on-surface-variant">Productos</dt><dd className="font-[family-name:var(--font-heading)] text-lg font-extrabold text-on-surface">{products.length}</dd></div>
          <div className="flex items-baseline gap-1.5"><dt className="text-sm text-on-surface-variant">Disponibles</dt><dd className="font-[family-name:var(--font-heading)] text-lg font-extrabold text-on-surface">{availableCount}</dd></div>
          {sourceCategories.length > 0 && <div className="flex items-baseline gap-1.5"><dt className="text-sm text-on-surface-variant">{sourceCategories.length === 1 ? 'Lista compartida' : 'Listas compartidas'}</dt><dd className="font-[family-name:var(--font-heading)] text-lg font-extrabold text-on-surface">{sourceCategories.length}</dd></div>}
        </dl>}
      </div>

      {(adding || (data && categories.length === 0)) && (
        <form onSubmit={addProduct} className="space-y-4 border-b border-primary/15 bg-primary/[0.035] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div><h3 className="font-bold text-on-surface">{selectedSource ? 'Nueva opción para tu lista' : 'Cargá un producto'}</h3><p className="mt-1 text-xs text-on-surface-variant">{selectedSource ? 'Se elige dentro de otros productos. No necesita precio propio.' : 'Nombre y precio primero. La foto y los detalles pueden esperar.'}</p></div>
            {categories.length > 0 && <button type="button" aria-label="Cerrar carga de producto" disabled={Boolean(busy) || photoUploading} onClick={() => setAdding(false)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-on-surface-variant hover:bg-primary/10"><MaterialIcon name="close" size="sm" /></button>}
          </div>
          <fieldset disabled={Boolean(busy)} className="grid min-w-0 gap-4 disabled:opacity-60 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-semibold text-on-surface sm:col-span-2">Categoría
              <select aria-label="Categoría del producto" value={resolvedCategoryId} onChange={(event) => setCategoryId(event.target.value)} className="mt-1.5 h-11 w-full min-w-0 rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 text-sm focus:outline-2 focus:outline-primary">
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}{category.isOptionSource ? ' · lista compartida' : ''}</option>)}
                <option value={NEW_CATEGORY}>+ Crear una categoría</option>
              </select>
            </label>
            {resolvedCategoryId === NEW_CATEGORY && <label className="space-y-1.5 text-sm font-semibold text-on-surface sm:col-span-2">Nombre de la categoría<Input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="Ej.: Pizzas, bebidas, postres…" className="mt-1.5 h-11" required /></label>}
            <label className={cn('space-y-1.5 text-sm font-semibold text-on-surface', selectedSource && 'sm:col-span-2')}>{selectedSource ? 'Nombre de la opción' : 'Nombre del producto'}<Input ref={nameRef} value={name} onChange={(event) => setName(event.target.value)} placeholder={selectedSource ? 'Ej.: Chocolate amargo' : 'Ej.: Pizza de muzzarella'} className="mt-1.5 h-11" required autoComplete="off" /></label>
            {!selectedSource && <label className="space-y-1.5 text-sm font-semibold text-on-surface">Precio · {currency}<MoneyInput value={price} onChange={setPrice} placeholder="0" aria-label="Precio del nuevo producto" className="mt-1.5 h-11 w-full px-3" /></label>}
          </fieldset>
          <button type="button" disabled={Boolean(busy) || photoUploading} onClick={() => setDetails(!details)} aria-expanded={details} className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-primary"><MaterialIcon name={details ? 'expand_more' : 'add_a_photo'} size="sm" />{details ? 'Ocultar detalles opcionales' : 'Sumar foto y descripción (opcional)'}</button>
          {details && <fieldset disabled={Boolean(busy)} className="grid gap-4 sm:grid-cols-[120px_1fr]">
            <ImageUpload value={imageUrl} onChange={setImageUrl} onUploadingChange={setPhotoUploading} type="menu" label="Foto" aspectRatio="square" />
            <label className="space-y-1.5 text-sm font-semibold text-on-surface">Descripción<textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Qué incluye, ingredientes o algún detalle útil." className="mt-1.5 min-h-24 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-3 text-sm focus:outline-2 focus:outline-primary" /></label>
          </fieldset>}
          <div className="flex flex-wrap items-center gap-3"><button type="submit" disabled={Boolean(busy) || photoUploading || Boolean(error)} className={cn(actionClass, 'w-full gradient-cta text-white sm:w-auto')}><MaterialIcon name={busy === 'create' || photoUploading ? 'progress_activity' : 'add'} size="sm" className={busy === 'create' || photoUploading ? 'animate-spin' : ''} />{photoUploading ? 'Esperando la foto…' : busy === 'create' ? 'Guardando…' : 'Guardar y agregar otro'}</button><p className="text-xs text-on-surface-variant">Se publica en tu menú al guardar.</p></div>
        </form>
      )}

      <div className="space-y-4 p-4 sm:p-6">
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-surface-container-low p-1" role="group" aria-label="Qué querés editar">
          {VIEWS.map((option) => <button key={option.key} type="button" disabled={Boolean(busy)} aria-pressed={view === option.key} onClick={() => { setView(option.key); setFeedback(null); }} className={cn('flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-colors sm:text-sm', view === option.key ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface')}><MaterialIcon name={option.icon} size="sm" className="hidden sm:block" />{option.label}</button>)}
        </div>
        <div className="relative"><MaterialIcon name="search" size="sm" className="absolute left-3 top-3.5 text-on-surface-variant" /><Input aria-label="Buscar un producto o sabor" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscá un producto o sabor…" className="h-11 pl-10" /></div>
        {categories.length > 0 && <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filtrar por categoría">
          {[{ id: 'all', name: 'Todo', isOptionSource: false }, ...categories].map((category) => <button key={category.id} type="button" aria-pressed={filter === category.id} onClick={() => setFilter(category.id)} className={cn('inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-bold transition-colors', filter === category.id ? 'border-primary/25 bg-primary/10 text-primary' : 'border-outline-variant/30 text-on-surface-variant hover:border-primary/30')}>{category.isOptionSource && <MaterialIcon name="layers" size="xs" />}{category.name}</button>)}
        </div>}

        {feedback && <p role="status" className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-3 text-sm leading-relaxed text-on-surface">{feedback}</p>}
        {loading && !data ? <p role="status" className="py-10 text-center text-sm text-on-surface-variant">Cargando tu carta…</p> : error ? <div role="alert" className="space-y-2 rounded-xl bg-error-container/30 p-4 text-sm"><p>{error}</p><button type="button" onClick={() => void onChanged()} className="font-bold text-primary">Volver a cargar</button></div> : (
          <div className="divide-y divide-outline-variant/25">
            {visible.map((entry) => {
              const { item, category } = entry;
              const isSource = Boolean(category.isOptionSource);
              const editablePrice = canEditBasePrice(entry);
              const displayPrice = item.variants.length > 0 ? Math.min(...item.variants.map((variant) => variant.priceOverride ?? item.basePrice)) : item.basePrice;
              return <div key={item.id} className="flex min-w-0 flex-wrap items-center gap-3 py-3.5 sm:flex-nowrap">
                <Link href={isSource ? `/menu?categoria=${encodeURIComponent(category.id)}` : `/menu?producto=${encodeURIComponent(item.id)}`} aria-label={`Editar ${item.name}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-container-low text-on-surface-variant">{item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-cover" /> : <MaterialIcon name={isSource ? 'layers' : 'restaurant_menu'} size="md" />}</span>
                  <span className="min-w-0"><span className="block truncate text-sm font-bold text-on-surface">{item.name}</span><span className="mt-1 block truncate text-xs text-on-surface-variant">{category.name}{isSource ? ' · opción compartida' : !item.isVisible ? ' · oculto en el menú' : item.variants.length ? ' · con tamaños' : ''}</span></span>
                </Link>
                <div className="ml-auto flex shrink-0 items-center gap-2">
                  {view === 'prices' ? editablePrice ? <MoneyInput aria-label={`Precio de ${item.name}`} disabled={Boolean(busy)} value={drafts[item.id] ?? String(item.basePrice)} onChange={(value) => setDrafts((current) => ({ ...current, [item.id]: value }))} className={cn('h-11 w-28 px-3', drafts[item.id] !== undefined && drafts[item.id] !== String(item.basePrice) && 'border-primary bg-primary/5')} /> : <Link href={`/menu?producto=${encodeURIComponent(item.id)}`} className="inline-flex min-h-11 items-center text-xs font-semibold text-primary">{isSource ? 'Sin precio propio' : 'Editar tamaños'}<MaterialIcon name="chevron_right" size="xs" /></Link> : view === 'availability' ? <button type="button" role="switch" aria-checked={item.isAvailable} aria-label={`Disponibilidad de ${item.name}`} disabled={Boolean(busy)} onClick={() => void changeAvailability(item)} className={cn('inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-xs font-bold disabled:opacity-50', item.isAvailable ? 'bg-success-container text-success' : 'bg-surface-container-high text-on-surface-variant')}><span className={cn('h-2 w-2 rounded-full', item.isAvailable ? 'bg-success' : 'bg-outline')} />{busy === item.id ? 'Guardando…' : item.isAvailable ? 'Disponible' : 'Agotado'}</button> : <>
                    {!isSource && <span className="text-right text-sm font-bold text-on-surface">{item.variants.length > 0 && <span className="block text-[10px] font-medium text-on-surface-variant">Desde</span>}{formatCurrency(displayPrice, currency).replace(` ${currency}`, '')}</span>}
                    <Link href={isSource ? `/menu?categoria=${encodeURIComponent(category.id)}` : `/menu?producto=${encodeURIComponent(item.id)}`} aria-label={`Editar detalles de ${item.name}`} className="flex h-11 w-10 items-center justify-center rounded-xl text-on-surface-variant hover:bg-primary/5 hover:text-primary"><MaterialIcon name="edit" size="sm" /></Link>
                  </>}
                </div>
              </div>;
            })}
            {filtered.length === 0 && <div className="py-8 text-center"><p className="text-sm font-semibold text-on-surface">{entries.length ? 'No encontramos ese producto.' : 'Tu primer producto empieza acá.'}</p><p className="mt-1 text-xs text-on-surface-variant">{entries.length ? 'Probá otro nombre o elegí otra categoría.' : 'No hace falta tener toda la carta lista para empezar.'}</p></div>}
          </div>
        )}

        {dirtyCount > 0 && <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3"><div><p className="text-sm font-bold text-on-surface">{dirtyCount} {dirtyCount === 1 ? 'precio sin guardar' : 'precios sin guardar'}</p><p className="mt-1 text-xs text-on-surface-variant">No cambian para tus clientes hasta que guardes.</p></div><div className="flex w-full gap-2 sm:w-auto"><button type="button" disabled={Boolean(busy)} onClick={() => setDrafts({})} className={cn(actionClass, 'text-on-surface-variant')}>Descartar</button><button type="button" disabled={Boolean(busy)} onClick={() => void savePrices()} className={cn(actionClass, 'flex-1 gradient-cta text-white')}>{busy === 'prices' ? 'Guardando…' : 'Guardar precios'}</button></div></div>}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/25 pt-4"><p className="text-xs text-on-surface-variant">{visible.length} de {filtered.length} {filter !== 'all' && sourceCategories.some((category) => category.id === filter) ? 'opciones' : 'productos y opciones'}</p><Link href={filter === 'all' ? '/menu' : `/menu?categoria=${encodeURIComponent(filter)}`} className="inline-flex min-h-10 items-center gap-1 text-sm font-bold text-primary">Abrir menú completo<MaterialIcon name="arrow_forward" size="sm" /></Link></div>
        <p className="text-xs leading-relaxed text-on-surface-variant">Los tamaños y extras se configuran en cada producto. ¿Ya tenés una carta impresa? <Link href="/onboarding?from=menu" className="font-semibold underline underline-offset-2">También podés importarla con IA.</Link></p>
      </div>
    </section>
  );
}
