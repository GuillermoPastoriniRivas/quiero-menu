"use client";

import { useId } from "react";
import {
  describeOptionRule,
  selectedInGroup,
  selectedUnitsInGroup,
  selectionIssues,
  setProductOptionQuantity,
  stableOptionId,
  optionSelectionMode,
} from "@/lib/menu-options";
import type { ProductOptionGroup } from "@/lib/menu-options";
import { formatCurrency } from "@/lib/format";
import type { SelectedOptionInput } from '@/types';

export function ProductOptions({
  groups,
  selections,
  onChange,
  currency,
}: {
  groups: ProductOptionGroup[];
  selections: SelectedOptionInput[];
  onChange: (selections: SelectedOptionInput[]) => void;
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
        const count = selectedInGroup(group, selections);
        const units = selectedUnitsInGroup(group, selections);
        const mode = optionSelectionMode(group);
        const single = mode === 'single';
        const quantities = mode === 'quantities';
        const descriptionId = `${id}-${index}`;
        const issue = selectionIssues([group], selections.filter(s => s.groupId === group.groupId))[0];
        return (
          <fieldset
            key={group.groupId}
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
                {quantities ? `${units}${group.requiredTotal != null ? ` / ${group.requiredTotal}` : ''} unidades · ` : ''}{count} {count === 1 ? "opción" : "opciones"}
              </span>
            </div>
            <div className="space-y-1.5">
              {group.options.map((option) => {
                const optionId = stableOptionId(option);
                const quantity = selections.find(s => s.groupId === group.groupId && s.optionId === optionId)?.quantity ?? 0;
                const checked = quantity > 0;
                const increment = () => setProductOptionQuantity(groups, selections, group.groupId, optionId, quantities ? quantity + 1 : 1);
                const atLimit = increment() === selections;
                const disabled = !option.isAvailable || (!checked && atLimit);
                const inputId = `${id}-${index}-${option.id}`;
                return (
                  <div
                    key={option.id}
                    className={`flex min-h-12 flex-wrap items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors ${checked ? "bg-primary/10 ring-1 ring-primary/30" : "bg-surface-container-low"} ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-surface-container"}`}
                  >
                    {!quantities && <input
                      id={inputId}
                      type={single ? "radio" : "checkbox"}
                      name={
                        single
                          ? `${id}-${group.selectionScope === "item" ? "legacy" : index}`
                          : undefined
                      }
                    checked={checked}
                     aria-label={`${option.name} en ${group.name}${!option.isAvailable ? ' · Agotada' : ''}`}
                      disabled={disabled}
                      onChange={() => onChange(setProductOptionQuantity(groups, selections, group.groupId, optionId, checked ? 0 : 1))}
                      className="h-5 w-5 shrink-0 accent-primary"
                    />}
                    <label htmlFor={quantities ? undefined : inputId} className="min-w-24 flex-1">
                      {option.name}
                      {option.description && (
                        <span className="mt-0.5 block text-xs font-normal text-on-surface-variant">
                          {option.description}
                        </span>
                      )}
                      {!option.isAvailable && (
                        <span className="ml-2 text-xs">Agotada</span>
                      )}
                    </label>
                    {option.priceDelta !== 0 && (
                      <span className="text-on-surface-variant">
                        {option.priceDelta > 0 ? "+" : ""}
                        {formatCurrency(option.priceDelta, currency)}
                      </span>
                    )}
                    {quantities && <div className="flex items-center gap-2">
                      <button type="button" aria-label={`Reducir ${option.name} en ${group.name}`} disabled={!option.isAvailable || quantity === 0}
                        onClick={() => onChange(setProductOptionQuantity(groups, selections, group.groupId, optionId, quantity - 1))}
                        className="h-10 w-10 rounded-lg bg-surface-container disabled:opacity-40">−</button>
                      <input type="number" min={0} step={1} aria-label={`Cantidad de ${option.name} en ${group.name}`} value={quantity} disabled={!option.isAvailable}
                        onChange={e => onChange(setProductOptionQuantity(groups, selections, group.groupId, optionId, e.target.valueAsNumber))}
                        className="h-10 w-14 rounded-lg bg-surface text-center" />
                      <button type="button" aria-label={`Aumentar ${option.name} en ${group.name}`} disabled={!option.isAvailable || atLimit}
                        onClick={() => onChange(increment())} className="h-10 w-10 rounded-lg bg-surface-container disabled:opacity-40">+</button>
                    </div>}
                  </div>
                );
              })}
            </div>
            {single && group.minSelections === 0 && count > 0 && (
              <button
                type="button"
                className="min-h-10 text-xs font-semibold text-primary underline"
                onClick={() => {
                  onChange(selections.filter(s => s.groupId !== group.groupId));
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
