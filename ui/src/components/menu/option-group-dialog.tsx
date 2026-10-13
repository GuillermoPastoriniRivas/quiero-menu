"use client";

import { useRef, useState } from "react";
import { describeOptionRule, optionGroupName } from "@/lib/menu-options";
import { sameGroup, optionInGroup, type EditorGroup, type EditorItem } from './editor-model';
import { MoneyInput } from '@/components/ui/money-input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Preset = "optional" | "one" | "up-to" | "exact" | "custom";
const selectClass =
  "h-11 w-full rounded-xl border border-input bg-background px-3 text-sm";

export function OptionGroupDialog({
  item,
  group,
  onClose,
  onSave,
  sources = [],
  initialVariantId,
  groupId,
}: {
  item: EditorItem;
  group: string;
  onClose: () => void;
  onSave: (groups: EditorGroup[]) => Promise<void>;
  sources?: { id: string; name: string; items: { id: string; name: string; isAvailable: boolean; basePrice?: number }[] }[];
  initialVariantId?: string | null;
  groupId?: string;
}) {
  const stored = (item.optionGroups ?? []).filter(
    (g) => g.selectionScope !== "item",
  );
  const initialScope = initialVariantId !== undefined ? initialVariantId || '' : stored.some(
    (g) => g.name === group && g.variantId === null,
  )
    ? ""
    : (stored.find((g) => sameGroup(g, { name: group, groupId }))?.variantId ?? "");
  const initial =
    item.optionGroups?.find(
      (g) => sameGroup(g, { name: group, groupId }) && g.variantId === (initialScope || null),
    ) ??
    item.optionGroups?.find((g) => g.name === group && g.variantId === null);
  const initialMin = initial?.minSelections ?? 0;
  const initialMax = initial?.maxSelections ?? 0;
  const initialPreset: Preset =
    initialMin === 1 && initialMax === 1
      ? "one"
      : initialMin > 0 && initialMin === initialMax
        ? "exact"
        : initialMin === 0
          ? initialMax > 0
            ? "up-to"
            : "optional"
          : "custom";
  const [variantId, setVariantId] = useState(initialScope);
  const [name, setName] = useState(group);
  const [selectionMode, setSelectionMode] = useState<NonNullable<EditorGroup['selectionMode']>>(initial?.selectionMode ?? (initialMax === 1 ? 'single' : 'multiple'));
  const [requiredTotal, setRequiredTotal] = useState(String(initial?.requiredTotal ?? 6));
  const [overrides, setOverrides] = useState<Record<string, string>>(() => Object.fromEntries((initial?.optionPriceOverrides ?? []).map((o) => [o.sourceItemId, String(o.priceDelta)])));
  const [sourceCategoryId, setSourceCategoryId] = useState(initial?.sourceCategoryId ?? '');
  const [required, setRequired] = useState(initialMin > 0);
  const [preset, setPreset] = useState<Preset>(initialPreset);
  const [min, setMin] = useState(String(initialMin));
  const [max, setMax] = useState(String(initialMax));
  const [n, setN] = useState(String(initialMax || 2));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const saving = useRef(false);
  const minimum =
    preset === "one"
      ? 1
      : preset === "exact"
        ? Number(n)
        : preset === "custom"
          ? Number(min)
          : preset === "up-to" && required ? 1 : 0;
  const maximum =
    preset === "one"
      ? 1
      : preset === "exact" || preset === "up-to"
        ? Number(n)
        : preset === "custom"
          ? Number(max)
          : 0;
  const invalidNumbers =
    !Number.isInteger(minimum) ||
    !Number.isInteger(maximum) ||
    minimum < 0 ||
    maximum < 0 ||
    ((preset === "exact" || preset === "up-to") && maximum < 1);
  let issue = invalidNumbers
    ? "Usá cantidades enteras válidas."
    : maximum > 0 && minimum > maximum
      ? "El mínimo no puede superar el máximo."
       : "";
  if (!name.trim()) issue ||= 'Dale un nombre al grupo.';
  if (selectionMode === 'single' && (maximum !== 1 || minimum > 1)) issue ||= 'Para elegir una opción, usá máximo 1 y mínimo 0 o 1.';
  if (selectionMode === 'quantities' && (!/^\d+$/.test(requiredTotal) || !Number.isSafeInteger(Number(requiredTotal)) || Number(requiredTotal) < 1 || minimum > Number(requiredTotal))) issue ||= 'Indicá el total entero del pack, igual o mayor al mínimo de variedades.';
  if (Object.values(overrides).some((value) => !/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)))) issue ||= 'Revisá los precios extra de este producto.';
  if (sourceCategoryId && item.options.some((o) => optionInGroup(o, { name, groupId } as EditorGroup) && (o.variantId === null || o.variantId === (variantId || null)))) issue ||= 'Este grupo tiene opciones propias. Usá otro nombre para la lista compartida, o quitá las opciones propias antes de vincularla.';
  const scopes = variantId
    ? [variantId]
    : item.variants.length
      ? item.variants.map((v) => v.id)
      : [null];
  for (const scope of scopes) {
    if (
      !variantId &&
      scope &&
      stored.some((g) => g.name === group && g.variantId === scope)
    )
      continue;
    const options = sourceCategoryId
      ? (sources.find((s) => s.id === sourceCategoryId)?.items ?? [])
      : item.options.filter(
      (o) =>
         optionGroupName(o) === name.trim() &&
        (o.variantId === null || o.variantId === scope),
    );
    const available = options.filter((o) => o.isAvailable).length;
    if (minimum > available)
      issue ||= `Solo hay ${available} opciones disponibles${scope ? ` en ${item.variants.find((v) => v.id === scope)?.name}` : ""}. Reducí el mínimo.`;
  }
  const save = async () => {
    if (saving.current || issue) return;
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      const others = stored.filter(
        (g) => !sameGroup(g, { name: group || name.trim(), groupId }) || g.variantId !== (variantId || null),
      );
      const stableId = initial?.groupId ?? groupId ?? stored.find((g) => g.name === name.trim())?.groupId ?? crypto.randomUUID();
      await onSave([
        ...others,
        {
          ...initial,
          name: name.trim(),
          groupId: stableId,
          minSelections: minimum,
          maxSelections: maximum,
          variantId: variantId || null,
          displayOrder: initial?.displayOrder ?? stored.length,
          sourceCategoryId: sourceCategoryId || null,
          selectionMode,
          requiredTotal: selectionMode === 'quantities' ? Number(requiredTotal) : null,
          optionPriceOverrides: sourceCategoryId ? Object.entries(overrides).map(([sourceItemId, priceDelta]) => ({ sourceItemId, priceDelta: Number(priceDelta) })) : [],
        },
      ]);
      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo guardar. Reintentá.",
      );
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !saving.current) onClose();
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
           <DialogTitle>{group ? `Cómo elegir ${group}` : 'Agregar grupo de elecciones'}</DialogTitle>
          <DialogDescription>
            Configurá lo que puede elegir tu cliente en {item.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {!group && <label className="block space-y-1 text-sm font-medium">Nombre del grupo<Input value={name} disabled={busy} onChange={(e) => setName(e.target.value)} placeholder="Sabores, salsas, rellenos…" /></label>}
          {sources.length > 0 && <div className="space-y-1">
            <Label htmlFor="group-source">Lista de opciones</Label>
            <select id="group-source" className={selectClass} disabled={busy} value={sourceCategoryId} onChange={(e) => {
              setSourceCategoryId(e.target.value);
              if (e.target.value && !sourceCategoryId) { setPreset('up-to'); setRequired(true); setN('2'); }
            }}>
              <option value="">Opciones propias de este producto</option>
              {sources.map((source) => <option key={source.id} value={source.id}>{source.name} · lista compartida</option>)}
            </select>
            {sourceCategoryId && <p className="text-xs text-muted-foreground">Los nombres y la disponibilidad se administran una sola vez en esta categoría.</p>}
          </div>}
          {item.variants.length > 0 && (
            <div className="space-y-1">
              <Label htmlFor="group-size">Tamaño</Label>
              <select
                id="group-size"
                className={selectClass}
                value={variantId}
                disabled={busy}
                onChange={(e) => {
                  const next = e.target.value;
                   setVariantId(next);
                  const rule =
                    item.optionGroups?.find(
                      (g) => g.name === group && g.variantId === (next || null),
                    ) ??
                    item.optionGroups?.find(
                      (g) => g.name === group && g.variantId === null,
                    );
                   setMin(String(rule?.minSelections ?? 0));
                   setMax(String(rule?.maxSelections ?? 0));
                   setPreset('custom');
                   setSourceCategoryId(rule?.sourceCategoryId ?? '');
                   setSelectionMode(rule?.selectionMode ?? ((rule?.maxSelections ?? 0) === 1 ? 'single' : 'multiple'));
                   setRequiredTotal(String(rule?.requiredTotal ?? 6));
                   setOverrides(Object.fromEntries((rule?.optionPriceOverrides ?? []).map((o) => [o.sourceItemId, String(o.priceDelta)])));
                }}
              >
                <option value="">Todos los tamaños (regla general)</option>
                {item.variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                La regla de un tamaño tiene prioridad sobre la general.
              </p>
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor="group-mode">¿Cómo elige el cliente?</Label>
            <select id="group-mode" className={selectClass} disabled={busy} value={selectionMode} onChange={(e) => {
              const mode = e.target.value as NonNullable<EditorGroup['selectionMode']>;
              setSelectionMode(mode);
              if (mode === 'single') { setPreset('custom'); setMin(initialMin > 0 ? '1' : '0'); setMax('1'); }
              else if (selectionMode === 'single') { setPreset('optional'); }
            }}>
              <option value="single">Una opción</option><option value="multiple">Varias opciones distintas</option><option value="quantities">Repartir unidades de un pack</option>
            </select>
          </div>
          {selectionMode === 'quantities' && <div className="space-y-1"><Label htmlFor="pack-total">Total de unidades del pack</Label><Input id="pack-total" type="number" min="1" step="1" value={requiredTotal} disabled={busy} onChange={(e) => setRequiredTotal(e.target.value)} /><p className="text-xs text-muted-foreground">Por ejemplo: 4 Oreo + 2 Tiramisú = 6 unidades. El mínimo y máximo de abajo cuentan variedades distintas.</p></div>}
          <div className="space-y-1">
             <Label htmlFor="group-preset">{selectionMode === 'quantities' ? 'Variedades permitidas' : 'Regla de elección'}</Label>
            <select
              id="group-preset"
              value={preset}
              disabled={busy}
              onChange={(e) => {
                setMin(String(minimum));
                setMax(String(maximum));
                setN(String(maximum || minimum || 2));
                setPreset(e.target.value as Preset);
              }}
              className={selectClass}
            >
              <option value="optional">Opcional, sin límite</option>
              <option value="one">Elegir una (obligatorio)</option>
              <option value="up-to">Hasta una cantidad</option>
              <option value="exact">Exactamente una cantidad</option>
              <option value="custom">Personalizar mínimo y máximo</option>
            </select>
          </div>
          {(preset === "up-to" || preset === "exact") && (
            <div className="space-y-1">
              <Label htmlFor="group-count">Cantidad</Label>
              <Input
                id="group-count"
                type="number"
                min="1"
                step="1"
                value={n}
                disabled={busy}
                onChange={(e) => setN(e.target.value)}
              />
            </div>
          )}
          {preset === 'up-to' && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={required} disabled={busy} onChange={(e) => setRequired(e.target.checked)} />Elegir al menos una opción</label>}
          {preset === "custom" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="group-min">Mínimo</Label>
                <Input
                  id="group-min"
                  type="number"
                  min="0"
                  step="1"
                  value={min}
                  disabled={busy}
                  onChange={(e) => setMin(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="group-max">Máximo (0: sin límite)</Label>
                <Input
                  id="group-max"
                  type="number"
                  min="0"
                  step="1"
                  value={max}
                  disabled={busy}
                  onChange={(e) => setMax(e.target.value)}
                />
              </div>
            </div>
          )}
          <div className="rounded-xl bg-primary/5 p-4">
            <p className="text-xs text-muted-foreground">Tu cliente verá</p>
            <p className="mt-1 font-semibold">
               {name} ·{" "}
              {issue
                ? "Revisá la configuración"
                : describeOptionRule(minimum, maximum)}
            </p>
            {selectionMode === 'quantities' && <p className="mt-1 text-sm">Repartí exactamente {requiredTotal} unidades.</p>}
            <p className="text-xs text-muted-foreground">
              {minimum > 0 ? "Obligatorio" : "Opcional"}
            </p>
          </div>
          {sourceCategoryId && <details className="rounded-xl border p-3"><summary className="cursor-pointer text-sm font-semibold">Precios extra solo en este producto/presentación</summary><p className="my-2 text-xs text-muted-foreground">Sin ajuste se usa el adicional de la lista. Un ajuste en 0 hace que la opción esté incluida acá; la fuente no cambia.</p><div className="space-y-2">{(sources.find((s) => s.id === sourceCategoryId)?.items ?? []).map((option) => <div key={option.id} className="flex flex-wrap items-center gap-2"><span className="min-w-0 flex-1 text-sm">{option.name}</span><label className="flex items-center gap-2 text-xs"><input type="checkbox" disabled={busy} checked={overrides[option.id] !== undefined} onChange={(e) => setOverrides((current) => { const next = { ...current }; if (e.target.checked) next[option.id] = String(option.basePrice ?? 0); else delete next[option.id]; return next; })} />Ajustar</label>{overrides[option.id] !== undefined && <MoneyInput aria-label={`Adicional de ${option.name} en ${item.name}`} disabled={busy} value={overrides[option.id]} onChange={(value) => setOverrides((current) => ({ ...current, [option.id]: value || '0' }))} className="w-24" />}</div>)}</div></details>}
          {!stored.some((g) => g.name === group) && (
            <p className="text-xs text-muted-foreground">
              Al guardar, este grupo tendrá su propia regla. Los otros grupos
              conservarán el límite por tamaño.
            </p>
          )}
          {(issue || error) && (
            <p role="alert" className="text-sm text-destructive">
              {issue || error}
            </p>
          )}
          <Button className="w-full" disabled={busy || !!issue} onClick={save}>
            {busy ? "Guardando…" : "Guardar regla"}
          </Button>
          {variantId &&
            stored.some(
              (g) => g.name === group && g.variantId === variantId,
            ) && (
              <Button
                variant="ghost"
                className="w-full"
                disabled={busy}
                onClick={async () => {
                  if (saving.current) return;
                  saving.current = true;
                  setBusy(true);
                  setError("");
                  try {
                    await onSave(
                      stored.filter(
                        (g) => g.name !== group || g.variantId !== variantId,
                      ),
                    );
                    onClose();
                  } catch (cause) {
                    setError(
                      cause instanceof Error
                        ? cause.message
                        : "No se pudo guardar. Reintentá.",
                    );
                  } finally {
                    saving.current = false;
                    setBusy(false);
                  }
                }}
              >
                Usar regla general para este tamaño
              </Button>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
