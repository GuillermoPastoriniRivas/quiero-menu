"use client";

import { useRef, useState } from "react";
import type { MenuItemOption } from "@/types";
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
import { toast } from "sonner";

export type OptionDialogState =
  | { mode: "create"; itemId: string }
  | { mode: "edit"; option: MenuItemOption };

export function OptionEditorDialog({
  dialog,
  onClose,
  onChanged,
}: {
  dialog: OptionDialogState;
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const option = dialog.mode === "edit" ? dialog.option : null;
  const [name, setName] = useState(option?.name ?? "");
  const [group, setGroup] = useState(option?.optionGroup ?? "");
  const [delta, setDelta] = useState(
    option?.priceDelta ? String(option.priceDelta) : "",
  );
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [error, setError] = useState("");
  const pending = useRef<PendingOption[]>([]);
  const saving = useRef(false);
  const createOption = useMenuStore((s) => s.createOption);
  const updateOption = useMenuStore((s) => s.updateOption);

  const save = async () => {
    if (saving.current || !name.trim() || !group.trim()) return;
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      if (dialog.mode === "edit") {
        await updateOption(dialog.option.id, {
          name: name.trim(),
          optionGroup: group.trim(),
          priceDelta: Number(delta || 0),
        });
      } else {
        pending.current = optionBatch(name, pending.current, () =>
          crypto.randomUUID(),
        );
        setProgress({ completed: 0, total: pending.current.length });
        const result = await saveOptionBatch(
          pending.current,
          (entry) =>
            createOption(dialog.itemId, {
              name: entry.name,
              optionGroup: group.trim(),
              priceDelta: Number(delta || 0),
              clientRequestId: entry.requestId,
            }),
          (completed) => setProgress((p) => ({ ...p, completed })),
        );
        pending.current = result.pending;
        if (result.error) {
          setName(result.pending.map((entry) => entry.name).join("\n"));
          setError(
            `${result.completed} ${result.completed === 1 ? "opción confirmada" : "opciones confirmadas"}. Quedan ${result.pending.length} por confirmar. Reintentá para continuar sin duplicarlas.`,
          );
          await onChanged();
          return;
        }
      }
      await onChanged();
      onClose();
      toast.success(
        dialog.mode === "edit" ? "Opción actualizada" : "Opciones guardadas",
      );
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
          <DialogTitle>
            {option ? "Editar opción" : "Agregar opciones"}
          </DialogTitle>
          <DialogDescription>
            {option
              ? "Actualizá el nombre, grupo y precio."
              : "Pegá una opción por línea. Todas usarán el mismo grupo y precio adicional."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="option-group">Grupo</Label>
            <Input
              id="option-group"
              value={group}
              disabled={busy || pending.current.length > 0}
              onChange={(e) => setGroup(e.target.value)}
              placeholder="Sabores, salsas, extras…"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="option-names">
              {option ? "Nombre" : "Opciones, una por línea"}
            </Label>
            {option ? (
              <Input
                id="option-names"
                value={name}
                disabled={busy}
                onChange={(e) => setName(e.target.value)}
              />
            ) : (
              <Textarea
                id="option-names"
                value={name}
                disabled={busy}
                onChange={(e) => setName(e.target.value)}
                placeholder={"Chocolate\nDulce de leche\nFrutilla"}
                rows={5}
              />
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="option-price">
              Precio adicional de cada opción
            </Label>
            <MoneyInput
              id="option-price"
              value={delta}
              disabled={busy || pending.current.length > 0}
              onChange={setDelta}
              placeholder="0"
              className="w-full"
            />
          </div>
          {error && (
            <p
              role="alert"
              className="rounded-xl bg-error-container/30 p-3 text-sm"
            >
              {error}
            </p>
          )}
          {busy && !option && (
            <p role="status" className="text-sm">
              Guardando {progress.completed} de {progress.total}…
            </p>
          )}
          <Button
            className="w-full"
            disabled={busy || !name.trim() || !group.trim()}
            onClick={save}
          >
            {busy
              ? "Guardando…"
              : error
                ? "Reintentar pendientes"
                : option
                  ? "Guardar cambios"
                  : "Guardar opciones"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
