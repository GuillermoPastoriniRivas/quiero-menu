'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useMenuStore } from '@/stores/menu.store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { MoneyInput } from '@/components/ui/money-input';
import { MaterialIcon } from '@/components/ui/material-icon';
import type { MenuItem } from '@/types';
import { listSignature, saveListRows, type ListDraft } from './shared-list-save';

export interface EditableList {
  id: string;
  name: string;
  items: (MenuItem & { variants?: unknown; options?: unknown })[];
}

const newKey = () => crypto.randomUUID();

/**
 * Editor de una lista de opciones (sabores): nombre, aclaración, precio extra y
 * disponibilidad, todo en un modal para no llenar la pantalla del producto.
 */
export function SharedListEditorDialog({
  list,
  onClose,
  onChanged,
  uses = [],
}: {
  list: EditableList | null;
  onClose: () => void;
  onChanged: () => Promise<void>;
  uses?: { name: string; href: string }[];
}) {
  const createItem = useMenuStore((s) => s.createItem);
  const updateItem = useMenuStore((s) => s.updateItem);
  const deleteItem = useMenuStore((s) => s.deleteItem);
  const createCategory = useMenuStore((s) => s.createCategory);
  const updateCategory = useMenuStore((s) => s.updateCategory);
  const [name, setName] = useState(list?.name ?? '');
  const categoryId = useRef(list?.id ?? '');
  const savedName = useRef(list?.name ?? '');
  const locked = useRef(false);
  const [rows, setRows] = useState<ListDraft[]>(() =>
    (list?.items ?? []).map((item) => {
      const row = {
      key: item.id,
      id: item.id,
      name: item.name,
      description: item.description ?? '',
      basePrice: item.basePrice ?? 0,
      isAvailable: item.isAvailable,
      };
      return { ...row, savedSignature: listSignature(row) };
    }),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const patch = (key: string, changes: Partial<ListDraft>) =>
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...changes } : row)));

  const visible = rows.filter((row) => !row.removed);

  const save = async () => {
    if (locked.current) return;
    if (!name.trim()) { setError('Dale un nombre a la lista.'); return; }
    const named = visible.filter((row) => row.name.trim());
    if (named.length !== visible.length) {
      setError('Todas las opciones necesitan un nombre.');
      return;
    }
    if (named.some((row) => !Number.isSafeInteger(row.basePrice) || row.basePrice < 0)) {
      setError('Revisá los precios extra. Usá números enteros iguales o mayores a cero.');
      return;
    }
    locked.current = true;
    setSaving(true);
    setError('');
    try {
      if (!categoryId.current) {
        const category = await createCategory({ name: name.trim(), isOptionSource: true });
        categoryId.current = category.id;
        savedName.current = category.name;
      } else if (savedName.current !== name.trim()) {
        await updateCategory(categoryId.current, { name: name.trim() });
        savedName.current = name.trim();
      }
      const result = await saveListRows(rows, {
        create: (payload) => createItem({ categoryId: categoryId.current, ...payload }),
        update: updateItem,
        remove: deleteItem,
      }, setRows);
      await onChanged();
      if (result.failures.length) {
        setError(`Hay cambios pendientes. Lo confirmado ya quedó guardado; reintentá solo los pendientes. ${result.failures.join(' · ')}`);
        return;
      }
      onClose();
      toast.success('Lista actualizada');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar. Reintentá.');
    } finally {
      locked.current = false;
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-lg max-h-[90dvh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
           <DialogTitle>{list ? `Editar «${list.name}»` : 'Crear lista compartida'}</DialogTitle>
          <DialogDescription>
            Estas opciones se usan en varios productos. Nombre, aclaración, precio extra y
            disponibilidad se administran una sola vez acá.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 min-w-0">
          <label className="block space-y-1 text-sm font-semibold">Nombre de la lista<Input value={name} disabled={saving} onChange={(e) => setName(e.target.value)} placeholder="Sabores, salsas, adicionales…" /></label>
          <p className="text-xs text-muted-foreground">Son opciones para elegir dentro de productos, no productos vendidos por separado. Cada precio es un adicional por defecto.</p>
          {uses.length > 0 && (
            <div className="space-y-2 rounded-xl bg-primary/5 p-3">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">Afecta estos usos</p>
              <ul className="space-y-1">
                {uses.map((use, index) => (
                  <li key={`${use.href}-${index}`}>
                    <a
                      href={use.href}
                      className="flex min-h-9 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-lowest"
                    >
                      <MaterialIcon name="restaurant_menu" size="xs" className="shrink-0 text-primary" />
                      <span className="min-w-0 truncate">{use.name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {visible.length === 0 ? (
            <p className="rounded-xl border border-dashed border-outline-variant/40 px-3 py-6 text-center text-sm text-muted-foreground">
              Todavía no hay opciones en esta lista.
            </p>
          ) : (
            <ul className="space-y-3">
              {visible.map((row) => (
                <li key={row.key} className="space-y-2 rounded-xl border border-outline-variant/30 p-3">
                  <div className="flex items-center gap-2">
                    <Input
                      value={row.name}
                      disabled={saving}
                      onChange={(e) => patch(row.key, { name: e.target.value })}
                      placeholder="Nombre de la opción"
                      aria-label="Nombre de la opción"
                      className="h-10 min-w-0 flex-1 font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => patch(row.key, { removed: true })}
                      disabled={saving}
                      aria-label={`Quitar ${row.name}`}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-error-container/40 hover:text-error"
                    >
                      <MaterialIcon name="delete" size="sm" />
                    </button>
                  </div>
                  <Input
                    value={row.description}
                    disabled={saving}
                    onChange={(e) => patch(row.key, { description: e.target.value })}
                    placeholder="Aclaración opcional (ej.: qué lleva)"
                    aria-label={`Aclaración de ${row.name}`}
                    className="h-10"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="flex min-w-0 items-center gap-2 text-sm text-on-surface-variant">
                      Precio extra
                      <MoneyInput
                        value={row.basePrice ? String(row.basePrice) : ''}
                        disabled={saving}
                        onChange={(v) => patch(row.key, { basePrice: v ? Number(v) : 0 })}
                        placeholder="0"
                        aria-label={`Precio extra de ${row.name}`}
                        className="h-10 w-28"
                      />
                    </label>
                    <label className="flex shrink-0 items-center gap-2 text-xs font-semibold text-on-surface-variant">
                      {row.isAvailable ? 'Disponible' : 'Agotado'}
                      <Switch
                        aria-label={`Disponibilidad de ${row.name}`}
                        checked={row.isAvailable}
                        onCheckedChange={(checked) => patch(row.key, { isAvailable: checked })}
                        disabled={saving}
                      />
                    </label>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={saving}
            onClick={() => setRows((prev) => [...prev, { key: newKey(), name: '', description: '', basePrice: 0, isAvailable: true }])}
          >
            <MaterialIcon name="add" size="sm" />
            Agregar opción
          </Button>

          {error && (
            <p role="alert" className="rounded-xl bg-error-container/30 p-3 text-sm">{error}</p>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="button" onClick={save} disabled={saving}>
              {saving ? 'Guardando…' : error ? 'Reintentar pendientes' : 'Guardar lista'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
