"use client";

import { useId } from "react";
import {
  describeOptionRule,
  selectedInGroup,
  selectionIssues,
  toggleProductOption,
} from "@/lib/menu-options";
import type { ProductOptionGroup } from "@/lib/menu-options";
import { formatCurrency } from "@/lib/format";

export function ProductOptions({
  groups,
  selectedIds,
  onToggle,
  currency,
}: {
  groups: ProductOptionGroup[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  currency: string;
}) {
  const id = useId();
  const legacy = groups.filter((g) => g.selectionScope === "item");
  const legacyMax = legacy[0]?.maxSelections ?? 0;
  return (
    <div className="space-y-5">
      {legacyMax > 0 && legacy.length > 1 && (
        <p className="rounded-xl bg-primary/5 p-3 text-sm">
          Elegí hasta {legacyMax} opciones en total para este tamaño.
        </p>
      )}
      {groups.map((group, index) => {
        const count = selectedInGroup(group, selectedIds);
        const single = group.maxSelections === 1;
        const descriptionId = `${id}-${index}`;
        const issue = selectionIssues([group], selectedIds)[0];
        return (
          <fieldset
            key={group.name}
            className="space-y-2"
            aria-describedby={descriptionId}
          >
            <legend className="text-sm font-semibold">
              {group.name}{" "}
              <span className="ml-1 text-xs font-normal text-on-surface-variant">
                {group.minSelections > 0 ? "Obligatorio" : "Opcional"}
              </span>
            </legend>
            <div
              id={descriptionId}
              className="flex justify-between gap-2 text-xs text-on-surface-variant"
            >
              <span>
                {describeOptionRule(group.minSelections, group.maxSelections)}
              </span>
              <span aria-live="polite">
                {count} {count === 1 ? "seleccionada" : "seleccionadas"}
              </span>
            </div>
            <div className="space-y-1.5">
              {group.options.map((option) => {
                const checked = selectedIds.includes(option.id);
                const atLimit =
                  !checked &&
                  toggleProductOption(groups, selectedIds, option.id) ===
                    selectedIds;
                const disabled = !option.isAvailable || atLimit;
                return (
                  <label
                    key={option.id}
                    className={`flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors ${checked ? "bg-primary/10 ring-1 ring-primary/30" : "bg-surface-container-low"} ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-surface-container"}`}
                  >
                    <input
                      type={single ? "radio" : "checkbox"}
                      name={
                        single
                          ? `${id}-${group.selectionScope === "item" ? "legacy" : index}`
                          : undefined
                      }
                    checked={checked}
                    aria-label={!option.isAvailable ? `${option.name} · Agotada` : undefined}
                      disabled={disabled}
                      onChange={() => onToggle(option.id)}
                      className="h-5 w-5 shrink-0 accent-primary"
                    />
                    <span className="flex-1">
                      {option.name}
                      {!option.isAvailable && (
                        <span className="ml-2 text-xs">Agotada</span>
                      )}
                    </span>
                    {option.priceDelta !== 0 && (
                      <span className="text-on-surface-variant">
                        {option.priceDelta > 0 ? "+" : ""}
                        {formatCurrency(option.priceDelta, currency)}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
            {single && group.minSelections === 0 && count > 0 && (
              <button
                type="button"
                className="min-h-10 text-xs font-semibold text-primary underline"
                onClick={() => {
                  const selected = group.options.find((o) =>
                    selectedIds.includes(o.id),
                  );
                  if (selected) onToggle(selected.id);
                }}
              >
                Quitar selección de {group.name}
              </button>
            )}
            {issue && (
              <p className="text-xs text-primary" aria-live="polite">
                {issue}
              </p>
            )}
            {!single &&
              group.maxSelections > 0 &&
              count >= group.maxSelections && (
                <p className="text-xs text-on-surface-variant">
                  Para cambiar, quitá una opción seleccionada.
                </p>
              )}
          </fieldset>
        );
      })}
    </div>
  );
}
