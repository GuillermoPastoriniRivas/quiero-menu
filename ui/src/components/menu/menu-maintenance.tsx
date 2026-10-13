'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { MoneyInput } from '@/components/ui/money-input';
import { Switch } from '@/components/ui/switch';
import { useMenuStore } from '@/stores/menu.store';
import { maintenanceEntries, maintenancePriceChanges, savePriceChanges, type MaintenanceEntry } from '@/lib/manual-menu';
import type { EditorCategory } from './editor-model';

const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function MenuMaintenance({ categories, view, search, onChanged, onEdit }: {
  categories: EditorCategory[];
  view: 'prices' | 'availability';
  search: string;
  onChanged: () => Promise<void>;
  onEdit: (entry: MaintenanceEntry) => void;
}) {
  const menu = useMenuStore();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState('');
  const [feedback, setFeedback] = useState('');
  const lock = useRef(false);
  const all = maintenanceEntries(categories);
  // Products with presentations get price rows per presentation, never a misleading base-price row.
  const priceRows = all.filter((entry) => entry.priceEditable !== false);
  const entries = (view === 'prices' ? priceRows : all).filter((entry) => normalize(`${entry.name} ${entry.context}`).includes(normalize(search)));
  const dirty = priceRows.filter((row) => drafts[row.key] !== undefined && drafts[row.key] !== String(row.price)).length;
  const save = async () => {
    if (lock.current) return;
    let changes;
    try { changes = maintenancePriceChanges(priceRows, drafts); }
    catch (cause) { setFeedback(cause instanceof Error ? cause.message : 'Revisá los precios.'); return; }
    if (!changes.length) return;
    lock.current = true; setBusy('prices'); setFeedback('');
    try {
      const result = await savePriceChanges(changes, async (change) => {
        if (change.kind === 'variant') await menu.updateVariant(change.id, { priceOverride: change.basePrice });
        else if (change.kind === 'option') await menu.updateOption(change.id, { priceDelta: change.basePrice });
        else await menu.updateItem(change.id, { basePrice: change.basePrice });
      });
      setDrafts((current) => { const next = { ...current }; result.saved.forEach((c) => delete next[c.key]); return next; });
      if (result.failed.length) setFeedback(`${result.saved.length} guardados. Pendientes: ${result.failed.map(({ change, message }) => `${change.name}: ${message}`).join(' · ')}. Conservamos esos borradores.`);
      else toast.success(`${result.saved.length} precios guardados`);
      await onChanged();
    } finally { lock.current = false; setBusy(''); }
  };
  const toggle = async (entry: MaintenanceEntry, available: boolean) => {
    if (lock.current) return;
    lock.current = true; setBusy(entry.key); setFeedback('');
    try {
      if (entry.kind === 'variant') await menu.updateVariant(entry.id, { isAvailable: available });
      else if (entry.kind === 'option') await menu.updateOption(entry.id, { isAvailable: available });
      else await menu.updateItem(entry.id, { isAvailable: available });
      await onChanged();
      toast.success(`${entry.name}: ${available ? 'disponible' : 'agotado'}`);
    } catch (cause) { setFeedback(cause instanceof Error ? cause.message : 'No se pudo cambiar la disponibilidad.'); }
    finally { lock.current = false; setBusy(''); }
  };
  return <section className="space-y-4">
    {[false, true].map((shared) => <div key={String(shared)} className="space-y-2">
      {entries.some((e) => e.shared === shared) && <h2 className="text-lg font-bold">{shared ? 'Opciones compartidas' : 'Productos, presentaciones y extras propios'}</h2>}
      {entries.filter((e) => e.shared === shared).map((entry) => <div key={entry.key} className="flex min-w-0 flex-wrap items-center gap-3 rounded-xl border bg-background p-3">
        <button type="button" disabled={!!busy} onClick={() => onEdit(entry)} className="min-w-0 flex-1 text-left"><span className="block text-sm font-semibold">{entry.name}</span><span className="block text-xs text-muted-foreground">{entry.context}</span></button>
        {view === 'prices' ? <div className="space-y-1"><MoneyInput aria-label={`Precio de ${entry.name} · ${entry.context}`} disabled={!!busy} value={drafts[entry.key] ?? String(entry.price)} onChange={(value) => setDrafts((current) => ({ ...current, [entry.key]: value }))} className="h-11 w-28" />{!entry.shared && entry.kind !== 'option' && (drafts[entry.key] ?? String(entry.price)) === '0' && <span className="block text-[11px] text-amber-700">Precio de venta en cero</span>}</div> : <label className="flex min-h-11 items-center gap-2 text-xs font-semibold">{busy === entry.key ? 'Guardando…' : entry.available ? 'Disponible' : 'Agotado'}<Switch aria-label={`Disponibilidad de ${entry.name} · ${entry.context}`} disabled={!!busy} checked={entry.available} onCheckedChange={(next) => void toggle(entry, next)} /></label>}
      </div>)}
    </div>)}
    {!entries.length && <p className="py-8 text-center text-muted-foreground">No hay resultados para esa búsqueda.</p>}
    {feedback && <p role="status" className="rounded-xl bg-muted p-3 text-sm">{feedback}</p>}
    {dirty > 0 && <div className="sticky bottom-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-background p-3 shadow-lg"><p className="text-sm font-semibold">{dirty} precios pendientes (incluye otras búsquedas)</p><div className="flex gap-2"><Button type="button" variant="ghost" disabled={!!busy} onClick={() => setDrafts({})}>Descartar</Button><Button type="button" disabled={!!busy} onClick={() => void save()}>{busy === 'prices' ? 'Guardando…' : 'Guardar precios'}</Button></div></div>}
  </section>;
}
