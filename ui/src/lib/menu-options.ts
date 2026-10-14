import type {
  MenuItem,
  MenuItemOption,
  MenuItemOptionGroup,
  MenuItemVariant,
  MenuItemComponent,
  MenuItemComponentChoice,
  OrderComponentInput,
  OrderItemComponent,
  SelectedOption,
  SelectedOptionInput,
} from "@/types";

export type ProductWithOptions = MenuItem & {
  options: MenuItemOption[];
  variants: MenuItemVariant[];
};
export type ProductOptionGroup = MenuItemOptionGroup & {
  groupId: string;
  options: MenuItemOption[];
};
export const optionGroupName = (option: Pick<MenuItemOption, "optionGroup">) =>
  option.optionGroup.trim() || "Extras";

/** El servidor entrega las reglas derivadas; el fallback permite usar una API anterior. */
export function productOptionGroups(
  item: ProductWithOptions,
  variantId: string | null,
): ProductOptionGroup[] {
  const rules = item.optionGroups ?? [];
  const groupKey = (g: { groupId?: string; name: string }) => g.groupId ?? `legacy:${g.name.trim() || 'Extras'}`;
  const optionKey = (o: MenuItemOption) => {
    if (o.groupId) return o.groupId;
    const matching = [...new Set(rules.filter(g => g.name.trim() === optionGroupName(o) &&
      (g.variantId === null || g.variantId === variantId)).map(groupKey))];
    return matching.length === 1 ? matching[0] : groupKey({ name: optionGroupName(o) });
  };
  const ruleFor = (key: string) => rules.find(g => groupKey(g) === key && g.variantId === variantId)
    ?? rules.find(g => groupKey(g) === key && g.variantId === null);
  const options = item.options.filter(option => {
    if (option.variantId !== null && option.variantId !== variantId) return false;
    const rule = ruleFor(optionKey(option));
    return !option.sourceItemId || (!!rule?.sourceCategoryId && option.variantId === rule.variantId);
  });
  const keys = [...new Set([
    ...options.map(optionKey),
    ...rules.filter(g => (g.groupId || g.sourceCategoryId) && (g.variantId === null || g.variantId === variantId)).map(groupKey),
  ])];
  return keys
    .map((key, index) => {
      const rule = ruleFor(key);
      const name = rule?.name ?? optionGroupName(options.find(o => optionKey(o) === key)!);
      return {
        name,
        minSelections: 0,
        maxSelections:
          item.variants.find((v) => v.id === variantId)?.maxSelections ?? 0,
        variantId,
        displayOrder: index,
        ...rule,
        groupId: key,
        selectionScope: rule ? (rule.selectionScope ?? "group") : "item",
        options: options.filter(option => optionKey(option) === key).map(option => {
          const override = rule?.optionPriceOverrides?.find(p => p.sourceItemId === option.sourceItemId);
          return override ? { ...option, priceDelta: override.priceDelta } : option;
        }),
      };
    })
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

export function describeOptionRule(min: number, max: number): string {
  if (min > 0 && min === max) return `Elegí ${min}`;
  if (min > 0 && max > 0) return `Elegí entre ${min} y ${max}`;
  if (min > 0) return `Elegí al menos ${min}`;
  return max > 0 ? `Elegí hasta ${max}` : "Opcional · sin límite";
}

export const stableOptionId = (option: MenuItemOption) => option.sourceItemId ?? option.id;
export const optionSelectionMode = (group: ProductOptionGroup) => group.selectionMode ?? (group.maxSelections === 1 ? 'single' : 'multiple');
type Selections = string[] | SelectedOptionInput[];

export function optionSelections(groups: ProductOptionGroup[], selections: Selections): SelectedOptionInput[] {
  return selections.flatMap(selection => {
    if (typeof selection !== 'string') return [selection];
    const group = groups.find(g => g.options.some(o => o.id === selection));
    const option = group?.options.find(o => o.id === selection);
    return group && option ? [{ groupId: group.groupId, optionId: stableOptionId(option), quantity: 1 }] : [];
  });
}

export const selectedInGroup = (group: ProductOptionGroup, selections: Selections) =>
  new Set(optionSelections([group], selections).filter(s => s.groupId === group.groupId && s.quantity > 0 &&
    group.options.some(o => stableOptionId(o) === s.optionId && o.isAvailable)).map(s => s.optionId)).size;

export const selectedUnitsInGroup = (group: ProductOptionGroup, selections: Selections) =>
  optionSelections([group], selections).filter(s => s.groupId === group.groupId).reduce((sum, s) => sum + s.quantity, 0);

export function selectionIssues(
  groups: ProductOptionGroup[],
  ids: Selections,
): string[] {
  const issues: string[] = [];
  const selections = optionSelections(groups, ids);
  const seen = new Set<string>();
  for (const s of selections) {
    const key = JSON.stringify([s.groupId, s.optionId]);
    const group = groups.find(g => g.groupId === s.groupId);
    const option = group?.options.find(o => stableOptionId(o) === s.optionId);
    if (!Number.isSafeInteger(s.quantity) || s.quantity < 0) issues.push('Las cantidades deben ser números enteros no negativos.');
    if (seen.has(key)) issues.push('Hay una opción repetida en el mismo grupo.');
    seen.add(key);
    if (!option || !option.isAvailable) issues.push(`Una opción de ${group?.name ?? 'tu selección'} ya no está disponible.`);
    if (group && optionSelectionMode(group) !== 'quantities' && s.quantity > 1) issues.push(`Elegí cada opción una sola vez en ${group.name}.`);
  }
  if (ids.some(s => typeof s === 'string' && !groups.some(g => g.options.some(o => o.id === s)))) issues.push('Una opción ya no está disponible.');
  for (const group of groups) {
    const count = selectedInGroup(group, ids);
    const missing = group.minSelections - count;
    if (missing > 0) {
      const available = group.options.filter(
        (option) => option.isAvailable,
      ).length;
      issues.push(
        available < group.minSelections
          ? `No hay suficientes opciones disponibles en ${group.name}. Probá otro tamaño o producto.`
          : `Te ${missing === 1 ? "falta 1 opción" : `faltan ${missing} opciones`} en ${group.name}.`,
      );
    }
    if (group.maxSelections > 0 && count > group.maxSelections)
      issues.push(`Elegí hasta ${group.maxSelections} en ${group.name}.`);
    if (optionSelectionMode(group) === 'single' && count > 1) issues.push(`Elegí una sola opción en ${group.name}.`);
    const total = selectedUnitsInGroup(group, selections);
    if (optionSelectionMode(group) === 'quantities' && group.requiredTotal != null &&
      !(group.minSelections === 0 && total === 0 && count === 0) && total !== group.requiredTotal)
      issues.push(`Completá ${group.requiredTotal} unidades en ${group.name} (seleccionaste ${total}).`);
  }
  const legacy = groups.filter((group) => group.selectionScope === "item");
  const max = legacy[0]?.maxSelections ?? 0;
  if (
    max > 0 &&
    legacy.reduce((count, group) => count + selectedInGroup(group, ids), 0) >
      max
  )
    issues.push(`Elegí hasta ${max} opciones en total para este tamaño.`);
  return issues;
}

export function toggleProductOption(
  groups: ProductOptionGroup[],
  ids: string[],
  optionId: string,
): string[] {
  if (ids.includes(optionId)) return ids.filter((id) => id !== optionId);
  const group = groups.find((g) =>
    g.options.some((o) => o.id === optionId && o.isAvailable),
  );
  if (!group) return ids;
  const legacy = groups.filter((g) => g.selectionScope === "item");
  const legacyMax = legacy[0]?.maxSelections ?? 0;
  if (group.selectionScope === "item" && legacyMax === 1) {
    const legacyIds = new Set(
      legacy.flatMap((g) => g.options.map((o) => o.id)),
    );
    return [...ids.filter((id) => !legacyIds.has(id)), optionId];
  }
  if (group.maxSelections === 1)
    return [
      ...ids.filter((id) => !group.options.some((o) => o.id === id)),
      optionId,
    ];
  if (
    group.maxSelections > 0 &&
    selectedInGroup(group, ids) >= group.maxSelections
  )
    return ids;
  if (
    group.selectionScope === "item" &&
    legacyMax > 0 &&
    legacy.reduce((count, g) => count + selectedInGroup(g, ids), 0) >= legacyMax
  )
    return ids;
  return [...ids, optionId];
}

/** Al cambiar de tamaño conserva las primeras elecciones compatibles hasta el nuevo tope. */
export function reconcileProductOptions(
  groups: ProductOptionGroup[],
  ids: string[],
): string[] {
  return [...new Set(ids)].reduce<string[]>((kept, id) => {
    const next = toggleProductOption(groups, kept, id);
    return next.length > kept.length ? next : kept;
  }, []);
}

/** Selecciones estables: el mismo sabor en dos grupos es una elección independiente. */
export function setProductOptionQuantity(groups: ProductOptionGroup[], selections: SelectedOptionInput[], groupId: string, optionId: string, quantity: number): SelectedOptionInput[] {
  if (!Number.isSafeInteger(quantity) || quantity < 0) return selections;
  const group = groups.find(g => g.groupId === groupId);
  if (!group?.options.some(o => stableOptionId(o) === optionId && o.isAvailable)) return selections;
  const mode = optionSelectionMode(group);
  if (mode !== 'quantities' && quantity > 1) return selections;
  let next = selections.filter(s => !(s.groupId === groupId && s.optionId === optionId));
  if (quantity > 0) {
    if (mode === 'single') next = next.filter(s => s.groupId !== groupId);
    const legacy = groups.filter(g => g.selectionScope === 'item');
    if (group.selectionScope === 'item' && legacy[0]?.maxSelections === 1) next = next.filter(s => !legacy.some(g => g.groupId === s.groupId));
    next = [...next, { groupId, optionId, quantity }];
  }
  if (group.maxSelections > 0 && selectedInGroup(group, next) > group.maxSelections) return selections;
  const legacy = groups.filter(g => g.selectionScope === 'item');
  const max = legacy[0]?.maxSelections ?? 0;
  if (max > 0 && legacy.reduce((n, g) => n + selectedInGroup(g, next), 0) > max) return selections;
  if (mode === 'quantities' && group.requiredTotal != null && selectedUnitsInGroup(group, next) > group.requiredTotal) return selections;
  return next;
}

/** Conserva cantidades compatibles; nunca convierte 3 unidades en una selección de 1. */
export function reconcileOptionSelections(groups: ProductOptionGroup[], selections: SelectedOptionInput[]): SelectedOptionInput[] {
  const kept: SelectedOptionInput[] = [];
  for (const s of selections) {
    const group = groups.find(g => g.groupId === s.groupId);
    if (!group || !Number.isSafeInteger(s.quantity) || s.quantity <= 0 || !group.options.some(o => stableOptionId(o) === s.optionId && o.isAvailable)) continue;
    if (optionSelectionMode(group) !== 'quantities' && s.quantity !== 1) continue;
    if (kept.some(k => k.groupId === s.groupId && k.optionId === s.optionId)) continue;
    const max = optionSelectionMode(group) === 'single' ? 1 : group.maxSelections;
    if (max > 0 && selectedInGroup(group, kept) >= max) continue;
    const legacy = groups.filter(g => g.selectionScope === 'item');
    if (group.selectionScope === 'item' && (legacy[0]?.maxSelections ?? 0) > 0 && legacy.reduce((n, g) => n + selectedInGroup(g, kept), 0) >= legacy[0].maxSelections) continue;
    kept.push(s);
  }
  return kept;
}

export function selectedOptionSnapshots(groups: ProductOptionGroup[], selections: SelectedOptionInput[]): SelectedOption[] {
  return selections.filter(s => s.quantity > 0).flatMap(s => {
    const group = groups.find(g => g.groupId === s.groupId);
    const option = group?.options.find(o => stableOptionId(o) === s.optionId);
    return group && option ? [{ ...s, name: option.name, groupName: group.name, ...(option.sourceItemId ? { sourceItemId: option.sourceItemId } : {}), priceDelta: option.priceDelta }] : [];
  });
}

export const optionsPrice = (groups: ProductOptionGroup[], selections: SelectedOptionInput[]) =>
  selectedOptionSnapshots(groups, selections).reduce((sum, o) => sum + o.priceDelta * (o.quantity ?? 1), 0);

export const activeComponentSlots = (item: ProductWithOptions, variantId: string | null) =>
  (item.components ?? []).filter(s => s.parentVariantId === null || s.parentVariantId === variantId).sort((a, b) => a.displayOrder - b.displayOrder);

export function componentChoiceProduct(choice: MenuItemComponentChoice, catalog: ProductWithOptions[]): ProductWithOptions | undefined {
  const item = catalog.find(i => i.id === choice.menuItemId);
  if (!item || !item.isAvailable || !item.isVisible || item.isOrderable === false || item.itemType === 'combo' || (item.components ?? []).length > 0) return;
  if (item.variants.length > 0 ? !item.variants.some(v => v.id === choice.variantId && v.isAvailable !== false) : choice.variantId != null) return;
  return item;
}

export function componentSelectionIssues(slots: MenuItemComponent[], selections: OrderComponentInput[], catalog: ProductWithOptions[]): string[] {
  const issues: string[] = [];
  for (const selection of selections) {
    if (!slots.some(s => s.slotId === selection.slotId)) issues.push('Un componente ya no corresponde a este tamaño.');
  }
  for (const slot of slots) {
    const matches = selections.filter(s => s.slotId === slot.slotId);
    if (!Number.isSafeInteger(slot.quantity) || slot.quantity < 1) issues.push(`La cantidad de ${slot.name} no es válida.`);
    if (matches.length !== 1) { issues.push(`Elegí un producto para ${slot.name}.`); continue; }
    const selected = matches[0];
    const choice = slot.choices.find(c => c.menuItemId === selected.menuItemId && c.variantId === (selected.variantId ?? null));
    const child = choice && componentChoiceProduct(choice, catalog);
    if (!child) { issues.push(`${slot.name} ya no está disponible. Elegí otra opción.`); continue; }
    issues.push(...selectionIssues(productOptionGroups(child, choice!.variantId), selected.selectedOptions ?? []).map(issue => `${slot.name}: ${issue}`));
  }
  return issues;
}

export function componentSnapshots(slots: MenuItemComponent[], selections: OrderComponentInput[], catalog: ProductWithOptions[]): OrderItemComponent[] {
  return slots.flatMap(slot => {
    const selected = selections.find(s => s.slotId === slot.slotId);
    const choice = selected && slot.choices.find(c => c.menuItemId === selected.menuItemId && c.variantId === (selected.variantId ?? null));
    const child = choice && catalog.find(i => i.id === choice.menuItemId);
    if (!selected || !choice || !child) return [];
    return [{ slotId: slot.slotId, slotName: slot.name, quantity: slot.quantity, menuItemId: child.id, menuItemName: child.name,
      variantId: choice.variantId, variantName: child.variants.find(v => v.id === choice.variantId)?.name ?? null,
      priceDelta: choice.priceDelta, selectedOptions: selectedOptionSnapshots(productOptionGroups(child, choice.variantId), selected.selectedOptions ?? []) }];
  });
}

export function productUnitPrice(item: ProductWithOptions, variantId: string | null, selections: SelectedOptionInput[], components: OrderComponentInput[], catalog: ProductWithOptions[]): number {
  return (item.variants.find(v => v.id === variantId)?.priceOverride ?? item.basePrice)
    + optionsPrice(productOptionGroups(item, variantId), selections)
    + componentSnapshots(activeComponentSlots(item, variantId), components, catalog).reduce((sum, c) =>
      sum + c.quantity * (c.priceDelta + c.selectedOptions.reduce((n, o) => n + o.priceDelta * (o.quantity ?? 1), 0)), 0);
}

/** Precio de entrada efectivo: tamaños disponibles y suplementos obligatorios incluidos. */
export function productStartingPrice(item: ProductWithOptions, catalog: ProductWithOptions[] = [item]): number | null {
  const variants = item.variants.length ? item.variants.filter(v => v.isAvailable !== false).map(v => v.id) : [null];
  const minimumOptions = (groups: ProductOptionGroup[]): number => {
    let sum = 0;
    for (const group of groups) {
      const prices = group.options.filter(o => o.isAvailable).map(o => o.priceDelta).sort((a, b) => a - b);
      const min = group.minSelections;
      const total = optionSelectionMode(group) === 'quantities' ? group.requiredTotal : null;
      if (prices.length < min || (total != null && min > total)) return Infinity;
      // Opcionales pueden quedar vacíos. Para cantidades, las unidades restantes van a la opción más barata.
      if (total != null && min > 0) sum += prices.slice(0, Math.max(1, min)).reduce((n, p) => n + p, 0) + Math.max(0, total - Math.max(1, min)) * prices[0];
      else sum += prices.slice(0, min).reduce((n, p) => n + p, 0);
    }
    return sum;
  };
  const prices = variants.map(id => {
    let price = (item.variants.find(v => v.id === id)?.priceOverride ?? item.basePrice) + minimumOptions(productOptionGroups(item, id));
    for (const slot of activeComponentSlots(item, id)) {
      const choices = slot.choices.flatMap(c => {
        const child = componentChoiceProduct(c, catalog);
        return child ? [c.priceDelta + minimumOptions(productOptionGroups(child, c.variantId))] : [];
      });
      price += slot.quantity * (choices.length ? Math.min(...choices) : Infinity);
    }
    return price;
  }).filter(Number.isFinite);
  return prices.length ? Math.min(...prices) : null;
}

/** "Desde" solo cuando el precio realmente puede variar: más de un tamaño, o elecciones obligatorias. */
export function priceVaries(item: ProductWithOptions): boolean {
  const sizes = new Set(item.variants.filter(v => v.isAvailable !== false).map(v => v.priceOverride ?? item.basePrice));
  return sizes.size > 1 || (item.optionGroups ?? []).some(g => g.minSelections > 0) || (item.components ?? []).length > 0;
}

export const selectedOptionsLabel = (options: SelectedOption[] = []) => options.map(o =>
  `${o.groupName ? `${o.groupName}: ` : ''}${o.quantity ?? 1}× ${o.name}`).join(', ');
