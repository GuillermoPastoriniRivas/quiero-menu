"use client";

import { useRef, useState } from "react";
import type { MenuItemOption } from "@/types";
import type { ProductWithOptions } from "@/lib/menu-options";
import { useMenuStore } from "@/stores/menu.store";
import { optionBatch, saveOptionBatch } from "@/lib/option-batch";
import type { PendingOption } from "@/lib/option-batch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MoneyInput } from "@/components/ui/money-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MaterialIcon } from "@/components/ui/material-icon";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type OptionDialogState =
  | { mode: "create"; item: ProductWithOptions }
  | { mode: "edit"; option: MenuItemOption };

export interface SharedList {
  id: string;
  name: string;
  items: { id: string; name: string; isAvailable: boolean }[];
}

type Mode = "product" | "list";
type ChooseRule = "optional" | "one" | "upto";
type OptionDraft = { name: string; description?: string };

const NEW_LIST = "__new__";
const TRIGGER_CLASS =
  "h-11 w-full rounded-xl border-none bg-surface-container-low px-4 text-base font-medium text-on-surface focus-visible:ring-2 focus-visible:ring-primary/30 md:text-sm";
const RULE_LABELS: Record<ChooseRule, string> = {
  optional: "Opcional, sin límite",
  one: "Elegir una (obligatorio)",
  upto: "Hasta una cantidad",
};

function mergeDrafts(current: OptionDraft[], raw: string[]): OptionDraft[] {
  const next = [...current];
  for (const value of raw) {
    const name = value.trim();
    if (name && !next.some((draft) => draft.name === name)) next.push({ name });
  }
  return next;
}

/** Lista editable: agregar de a uno, aclaración opcional por opción, quitar, o pegar en bloque. */
function OptionsEditor({
  value,
  onChange,
  disabled,
  placeholder,
}: {
  value: OptionDraft[];
  onChange: (next: OptionDraft[]) => void;
  disabled: boolean;
  placeholder: string;
}) {
  const [entry, setEntry] = useState("");
  const [bulk, setBulk] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [openDesc, setOpenDesc] = useState<Set<string>>(new Set());

  const add = () => {
    const name = entry.trim();
    if (!name) return;
    onChange(mergeDrafts(value, [name]));
    setEntry("");
  };

  const toggleDesc = (name: string) => {
    const willOpen = !openDesc.has(name);
    setOpenDesc((prev) => {
      const next = new Set(prev);
      if (willOpen) next.add(name);
      else next.delete(name);
      return next;
    });
    if (willOpen) {
      onChange(value.map((draft) => (draft.name === name && draft.description === undefined ? { ...draft, description: "" } : draft)));
    }
  };

  const setDescription = (name: string, text: string) =>
    onChange(value.map((draft) => (draft.name === name ? { ...draft, description: text } : draft)));

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={entry}
          disabled={disabled}
          onChange={(e) => setEntry(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          autoComplete="off"
        />
        <Button type="button" variant="outline" className="shrink-0" disabled={disabled || !entry.trim()} onClick={add}>
          <MaterialIcon name="add" size="sm" />
          Agregar
        </Button>
      </div>

      {value.length === 0 ? (
        <p className="rounded-xl border border-dashed border-outline-variant/40 px-3 py-4 text-center text-sm text-muted-foreground">
          Todavía no agregaste ninguna.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {value.map((draft, index) => {
            const showDesc = openDesc.has(draft.name) || Boolean(draft.description);
            return (
              <li key={`${draft.name}-${index}`} className="rounded-xl bg-surface-container-low px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate">{draft.name}</span>
                  <button
                    type="button"
                    onClick={() => toggleDesc(draft.name)}
                    disabled={disabled}
                    aria-label={showDesc ? `Ocultar aclaración de ${draft.name}` : `Agregar aclaración a ${draft.name}`}
                    title="Aclaración opcional"
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-primary/10 hover:text-primary",
                      showDesc ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    <MaterialIcon name="edit_note" size="xs" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange(value.filter((_, i) => i !== index))}
                    disabled={disabled}
                    aria-label={`Quitar ${draft.name}`}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-error-container/40 hover:text-error"
                  >
                    <MaterialIcon name="close" size="xs" />
                  </button>
                </div>
                {showDesc && (
                  <Input
                    value={draft.description ?? ""}
                    disabled={disabled}
                    onChange={(e) => setDescription(draft.name, e.target.value)}
                    placeholder="Aclaración opcional (ej.: qué lleva, con qué viene)"
                    className="mt-2 h-9 text-sm"
                    autoComplete="off"
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-muted-foreground">
          {value.length} {value.length === 1 ? "opción" : "opciones"}
        </span>
        <button
          type="button"
          onClick={() => setBulk((v) => !v)}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-primary"
        >
          <MaterialIcon name={bulk ? "expand_less" : "edit_note"} size="xs" />
          {bulk ? "Ocultar pegado en bloque" : "Pegar varias de una"}
        </button>
      </div>

      {bulk && (
        <div className="space-y-2 rounded-xl bg-surface-container-low p-3">
          <Textarea
            value={bulkText}
            disabled={disabled}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={"Chocolate\nDulce de leche\nFrutilla"}
            rows={4}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full"
            disabled={disabled || !bulkText.trim()}
            onClick={() => {
              onChange(mergeDrafts(value, bulkText.split("\n")));
              setBulkText("");
              setBulk(false);
            }}
          >
            Sumar estas a la lista
          </Button>
        </div>
      )}
    </div>
  );
}

export function OptionEditorDialog({
  dialog,
  sources = [],
  onClose,
  onChanged,
}: {
  dialog: OptionDialogState;
  sources?: SharedList[];
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const option = dialog.mode === "edit" ? dialog.option : null;
  const item = dialog.mode === "create" ? dialog.item : null;

  const [mode, setMode] = useState<Mode>("product");
  const [name, setName] = useState(option?.name ?? "");
  const [optionDescription, setOptionDescription] = useState(option?.description ?? "");
  const [group, setGroup] = useState(option?.optionGroup ?? "");
  const [delta, setDelta] = useState(option?.priceDelta ? String(option.priceDelta) : "");
  const [productItems, setProductItems] = useState<OptionDraft[]>([]);
  const [listId, setListId] = useState<string>(sources[0]?.id ?? NEW_LIST);
  const [listName, setListName] = useState("");
  const [listItems, setListItems] = useState<OptionDraft[]>([]);
  const [chooseRule, setChooseRule] = useState<ChooseRule>("optional");
  const [chooseCount, setChooseCount] = useState("2");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [error, setError] = useState("");
  const pending = useRef<PendingOption[]>([]);
  const createdList = useRef<{ id: string; made: string[] } | null>(null);
  const saving = useRef(false);

  const createOption = useMenuStore((s) => s.createOption);
  const updateOption = useMenuStore((s) => s.updateOption);
  const createCategory = useMenuStore((s) => s.createCategory);
  const createItem = useMenuStore((s) => s.createItem);
  const updateItemOptionGroups = useMenuStore((s) => s.updateItemOptionGroups);

  const chosenList = sources.find((s) => s.id === listId) ?? null;
  const listLabel = (value: string) => {
    if (value === NEW_LIST) return "＋ Crear lista nueva";
    const source = sources.find((s) => s.id === value);
    if (!source) return "Elegí una lista";
    return `${source.name} · ${source.items.length} ${source.items.length === 1 ? "opción" : "opciones"}`;
  };
  const ruleMin = chooseRule === "one" ? 1 : 0;
  const ruleMax = chooseRule === "one" ? 1 : chooseRule === "upto" ? Math.max(1, Number(chooseCount) || 1) : 0;

  const canSave = option
    ? Boolean(name.trim())
    : mode === "product"
      ? productItems.length > 0 && Boolean(group.trim())
      : listId === NEW_LIST
        ? listItems.length > 0 && Boolean(listName.trim())
        : Boolean(chosenList);

  const saveProduct = async () => {
    const descriptionByName = new Map(
      productItems.map((draft) => [draft.name, draft.description?.trim() || undefined]),
    );
    pending.current = optionBatch(productItems.map((draft) => draft.name).join("\n"), pending.current, () => crypto.randomUUID());
    setProgress({ completed: 0, total: pending.current.length });
    const result = await saveOptionBatch(
      pending.current,
      (entry) =>
        createOption(item!.id, {
          name: entry.name,
          description: descriptionByName.get(entry.name),
          optionGroup: group.trim(),
          priceDelta: Number(delta || 0),
          clientRequestId: entry.requestId,
        }),
      (completed) => setProgress((p) => ({ ...p, completed })),
    );
    pending.current = result.pending;
    if (result.error) {
      setProductItems(result.pending.map((entry) => ({ name: entry.name, description: descriptionByName.get(entry.name) })));
      setError(
        `${result.completed} ${result.completed === 1 ? "opción confirmada" : "opciones confirmadas"}. Quedan ${result.pending.length} por confirmar. Reintentá para continuar sin duplicarlas.`,
      );
      await onChanged();
      return false;
    }
    return true;
  };

  const saveList = async () => {
    if (!item) return false;
    let sourceId = listId;
    let ruleName = chosenList?.name ?? listName.trim();

    if (listId === NEW_LIST) {
      // Reusa la lista ya creada si un intento anterior falló a mitad.
      if (!createdList.current) {
        const category = await createCategory({ name: listName.trim(), isOptionSource: true });
        createdList.current = { id: category.id, made: [] };
      }
      sourceId = createdList.current.id;
      ruleName = listName.trim();
      const made = createdList.current.made;
      const todo = listItems.filter((entry) => !made.includes(entry.name));
      setProgress({ completed: made.length, total: listItems.length });
      for (const flavor of todo) {
        await createItem({
          categoryId: sourceId,
          name: flavor.name,
          basePrice: 0,
          description: flavor.description?.trim() || undefined,
        });
        made.push(flavor.name);
        setProgress((p) => ({ ...p, completed: made.length }));
      }
    }

    const existing = (item.optionGroups ?? []).filter(
      (g) => g.name !== ruleName || g.variantId !== null,
    );
    await updateItemOptionGroups(item.id, [
      ...existing,
      {
        name: ruleName,
        minSelections: ruleMin,
        maxSelections: ruleMax,
        variantId: null,
        displayOrder: existing.length,
        sourceCategoryId: sourceId,
      },
    ]);
    return true;
  };

  const save = async () => {
    if (saving.current || !canSave) return;
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      let ok = true;
      if (option) {
        await updateOption(option.id, {
          name: name.trim(),
          description: optionDescription.trim(),
          optionGroup: group.trim(),
          priceDelta: Number(delta || 0),
        });
      } else if (mode === "product") {
        ok = await saveProduct();
      } else {
        ok = await saveList();
      }
      if (!ok) return;
      await onChanged();
      onClose();
      toast.success(
        option
          ? "Opción actualizada"
          : mode === "list"
            ? listId === NEW_LIST
              ? `Lista «${listName.trim()}» creada y agregada`
              : `Lista «${chosenList?.name}» agregada`
            : "Opciones guardadas",
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar. Reintentá.");
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };

  const otherGroups = (item?.optionGroups ?? []).length;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !saving.current) onClose();
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{option ? "Editar opción" : "Agregar opciones"}</DialogTitle>
          <DialogDescription>
            {option
              ? "Actualizá el nombre, la aclaración, el grupo y el precio."
              : "Para sabores que repetís en varios productos, creá una lista compartida."}
          </DialogDescription>
        </DialogHeader>

        {!option && (
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface-container-low p-1" role="group" aria-label="Tipo de opciones">
            <button
              type="button"
              aria-pressed={mode === "product"}
              disabled={busy}
              onClick={() => setMode("product")}
              className={cn(
                "flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-2 text-[13px] font-bold transition-colors",
                mode === "product" ? "bg-surface-container-lowest text-on-surface shadow-sm" : "text-on-surface-variant",
              )}
            >
              <MaterialIcon name="restaurant_menu" size="sm" />
              De este producto
            </button>
            <button
              type="button"
              aria-pressed={mode === "list"}
              disabled={busy}
              onClick={() => setMode("list")}
              className={cn(
                "flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-2 text-[13px] font-bold transition-colors",
                mode === "list" ? "bg-surface-container-lowest text-on-surface shadow-sm" : "text-on-surface-variant",
              )}
            >
              <MaterialIcon name="layers" size="sm" />
              Lista compartida
            </button>
          </div>
        )}

        <div className="space-y-4">
          {/* ----- Editar una opción ----- */}
          {option && (
            <>
              <div className="space-y-1">
                <Label htmlFor="option-group">Grupo</Label>
                <Input id="option-group" value={group} disabled={busy} onChange={(e) => setGroup(e.target.value)} placeholder="Sabores, salsas, extras…" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="option-name">Nombre</Label>
                <Input id="option-name" value={name} disabled={busy} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="option-description">Aclaración (opcional)</Label>
                <Input
                  id="option-description"
                  value={optionDescription}
                  disabled={busy}
                  onChange={(e) => setOptionDescription(e.target.value)}
                  placeholder="Ej.: qué lleva, con qué viene"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="option-price">Precio adicional de cada opción</Label>
                <MoneyInput id="option-price" value={delta} disabled={busy} onChange={setDelta} placeholder="0" className="w-full" />
              </div>
            </>
          )}

          {/* ----- Modo: propias del producto ----- */}
          {!option && mode === "product" && (
            <>
              <div className="space-y-1">
                <Label htmlFor="option-group">Grupo</Label>
                <Input id="option-group" value={group} disabled={busy} onChange={(e) => setGroup(e.target.value)} placeholder="Salsas, extras…" />
              </div>
              <div className="space-y-1">
                <Label>Opciones</Label>
                <OptionsEditor value={productItems} onChange={setProductItems} disabled={busy} placeholder="Ej.: Ketchup" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="option-price">Precio adicional de cada opción</Label>
                <MoneyInput id="option-price" value={delta} disabled={busy} onChange={setDelta} placeholder="0" className="w-full" />
              </div>
            </>
          )}

          {/* ----- Modo: lista compartida ----- */}
          {!option && mode === "list" && (
            <>
              <div className="space-y-1">
                <Label htmlFor="list-pick">Lista</Label>
                <Select value={listId} onValueChange={(value) => setListId(value as string)}>
                  <SelectTrigger id="list-pick" className={TRIGGER_CLASS} disabled={busy}>
                    <SelectValue>{(value) => listLabel(value as string)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {sources.map((source) => (
                      <SelectItem key={source.id} value={source.id}>
                        {source.name} · {source.items.length} {source.items.length === 1 ? "opción" : "opciones"}
                      </SelectItem>
                    ))}
                    <SelectItem value={NEW_LIST}>＋ Crear lista nueva</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {listId === NEW_LIST ? (
                <>
                  <div className="space-y-1">
                    <Label htmlFor="list-name">Nombre de la lista</Label>
                    <Input
                      id="list-name"
                      value={listName}
                      disabled={busy}
                      onChange={(e) => setListName(e.target.value)}
                      placeholder="Ej.: Sabores"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Sabores / opciones</Label>
                    <OptionsEditor value={listItems} onChange={setListItems} disabled={busy} placeholder="Ej.: Chocolate" />
                  </div>
                </>
              ) : (
                chosenList && (
                  <div className="rounded-xl bg-surface-container-low p-3">
                    <p className="text-xs font-semibold text-muted-foreground">
                      Se usan las {chosenList.items.length} opciones de «{chosenList.name}». Se administran una sola vez desde esa lista.
                    </p>
                    {chosenList.items.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {chosenList.items.slice(0, 12).map((entry) => (
                          <span key={entry.id} className="rounded-full bg-surface-container-lowest px-2 py-0.5 text-xs text-on-surface-variant">
                            {entry.name}
                          </span>
                        ))}
                        {chosenList.items.length > 12 && (
                          <span className="rounded-full px-2 py-0.5 text-xs text-on-surface-variant">+{chosenList.items.length - 12}</span>
                        )}
                      </div>
                    )}
                  </div>
                )
              )}

              <div className="space-y-1">
                <Label htmlFor="list-rule">¿Cuántas puede elegir el cliente?</Label>
                <Select value={chooseRule} onValueChange={(value) => setChooseRule(value as ChooseRule)}>
                  <SelectTrigger id="list-rule" className={TRIGGER_CLASS} disabled={busy}>
                    <SelectValue>{(value) => RULE_LABELS[(value as ChooseRule) ?? "optional"] ?? RULE_LABELS.optional}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="optional">{RULE_LABELS.optional}</SelectItem>
                    <SelectItem value="one">{RULE_LABELS.one}</SelectItem>
                    <SelectItem value="upto">{RULE_LABELS.upto}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {chooseRule === "upto" && (
                <div className="space-y-1">
                  <Label htmlFor="list-count">Cantidad máxima</Label>
                  <Input
                    id="list-count"
                    type="number"
                    min="1"
                    step="1"
                    value={chooseCount}
                    disabled={busy}
                    onChange={(e) => setChooseCount(e.target.value)}
                  />
                </div>
              )}
            </>
          )}

          {error && (
            <p role="alert" className="rounded-xl bg-error-container/30 p-3 text-sm">
              {error}
            </p>
          )}
          {busy && !option && (
            <p role="status" className="text-sm">
              Guardando {progress.completed} de {progress.total || "…"}…
            </p>
          )}

          <Button className="w-full" disabled={busy || !canSave} onClick={save}>
            {busy
              ? "Guardando…"
              : error
                ? "Reintentar"
                : option
                  ? "Guardar cambios"
                  : mode === "list"
                    ? listId === NEW_LIST
                      ? "Crear lista y usar"
                      : "Usar esta lista"
                    : `Guardar ${productItems.length || ""} ${productItems.length === 1 ? "opción" : "opciones"}`.trim()}
          </Button>

          {mode === "list" && otherGroups > 0 && (
            <p className="text-xs text-muted-foreground">
              Se agrega como un grupo más del producto; los demás grupos no se tocan.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
