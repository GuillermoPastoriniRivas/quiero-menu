"use client";

import { useRef, useState } from "react";
import type { MenuItemOptionGroup } from "@/types";
import { describeOptionRule, optionGroupName } from "@/lib/menu-options";
import type { ProductWithOptions } from "@/lib/menu-options";
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
}: {
  item: ProductWithOptions;
  group: string;
  onClose: () => void;
  onSave: (groups: MenuItemOptionGroup[]) => Promise<void>;
  sources?: { id: string; name: string; items: { id: string; name: string; isAvailable: boolean }[] }[];
}) {
  const stored = (item.optionGroups ?? []).filter(
    (g) => g.selectionScope !== "item",
  );
  const initialScope = stored.some(
    (g) => g.name === group && g.variantId === null,
  )
    ? ""
    : (item.variants[0]?.id ?? "");
  const initial =
    item.optionGroups?.find(
      (g) => g.name === group && g.variantId === (initialScope || null),
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
        optionGroupName(o) === group &&
        (o.variantId === null || o.variantId === scope),
    );
    const available = options.filter((o) => o.isAvailable).length;
    if (options.length > 0 && minimum > available)
      issue ||= `Solo hay ${available} opciones disponibles${scope ? ` en ${item.variants.find((v) => v.id === scope)?.name}` : ""}. Reducí el mínimo.`;
  }
  const save = async () => {
    if (saving.current || issue) return;
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      const others = stored.filter(
        (g) => g.name !== group || g.variantId !== (variantId || null),
      );
      await onSave([
        ...others,
        {
          name: group,
          minSelections: minimum,
          maxSelections: maximum,
          variantId: variantId || null,
          displayOrder: initial?.displayOrder ?? stored.length,
          sourceCategoryId: sourceCategoryId || null,
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
          <DialogTitle>Cómo elegir {group}</DialogTitle>
          <DialogDescription>
            Configurá lo que puede elegir tu cliente en {item.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
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
                  setPreset("custom");
                  const rule =
                    item.optionGroups?.find(
                      (g) => g.name === group && g.variantId === (next || null),
                    ) ??
                    item.optionGroups?.find(
                      (g) => g.name === group && g.variantId === null,
                    );
                  setMin(String(rule?.minSelections ?? 0));
                  setMax(String(rule?.maxSelections ?? 0));
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
            <Label htmlFor="group-preset">Tipo de elección</Label>
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
              {group} ·{" "}
              {issue
                ? "Revisá la configuración"
                : describeOptionRule(minimum, maximum)}
            </p>
            <p className="text-xs text-muted-foreground">
              {minimum > 0 ? "Obligatorio" : "Opcional"}
            </p>
          </div>
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
