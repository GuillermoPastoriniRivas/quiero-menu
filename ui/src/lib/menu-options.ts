import type {
  MenuItem,
  MenuItemOption,
  MenuItemOptionGroup,
  MenuItemVariant,
} from "@/types";

export type ProductWithOptions = MenuItem & {
  options: MenuItemOption[];
  variants: MenuItemVariant[];
};
export type ProductOptionGroup = MenuItemOptionGroup & {
  options: MenuItemOption[];
};
export const optionGroupName = (option: Pick<MenuItemOption, "optionGroup">) =>
  option.optionGroup.trim() || "Extras";

/** El servidor entrega las reglas derivadas; el fallback permite usar una API anterior. */
export function productOptionGroups(
  item: ProductWithOptions,
  variantId: string | null,
): ProductOptionGroup[] {
  const options = item.options.filter(
    (option) => {
      if (option.variantId !== null && option.variantId !== variantId) return false;
      if (!option.sourceItemId) return true;
      const rule = item.optionGroups?.find((g) => g.name === optionGroupName(option) && g.variantId === variantId)
        ?? item.optionGroups?.find((g) => g.name === optionGroupName(option) && g.variantId === null);
      return !!rule?.sourceCategoryId && option.variantId === rule.variantId;
    },
  );
  const names = [...new Set([
    ...options.map(optionGroupName),
    ...(item.optionGroups ?? []).filter((g) => g.sourceCategoryId && (g.variantId === null || g.variantId === variantId)).map((g) => g.name),
  ])];
  return names
    .map((name, index) => {
      const rule =
        item.optionGroups?.find(
          (g) => g.name === name && g.variantId === variantId,
        ) ??
        item.optionGroups?.find((g) => g.name === name && g.variantId === null);
      return {
        name,
        minSelections: 0,
        maxSelections:
          item.variants.find((v) => v.id === variantId)?.maxSelections ?? 0,
        variantId,
        displayOrder: index,
        ...rule,
        selectionScope: rule ? (rule.selectionScope ?? "group") : "item",
        options: options.filter((option) => optionGroupName(option) === name),
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

export const selectedInGroup = (group: ProductOptionGroup, ids: string[]) =>
  group.options.filter(
    (option) => option.isAvailable && ids.includes(option.id),
  ).length;

export function selectionIssues(
  groups: ProductOptionGroup[],
  ids: string[],
): string[] {
  const issues: string[] = [];
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
