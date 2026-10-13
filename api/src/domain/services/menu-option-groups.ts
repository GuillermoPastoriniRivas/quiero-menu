import type { MenuItem } from '../entities/menu-item.entity.js';
import type { MenuItemOption } from '../entities/menu-item-option.entity.js';
import { MenuItemOptionGroup } from '../entities/menu-item-option-group.entity.js';
import type { MenuItemVariant } from '../entities/menu-item-variant.entity.js';

export const optionGroupName = (option: Pick<MenuItemOption, 'optionGroup'>) =>
  option.optionGroup.trim() || 'Extras';

/** Stable across reads; the editor persists this ID on the first save. */
export const effectiveGroupId = (group: Pick<MenuItemOptionGroup, 'name' | 'groupId'>) =>
  group.groupId || `legacy:${encodeURIComponent(group.name.trim())}`;

export function sameOptionGroup(
  a: Pick<MenuItemOptionGroup, 'name' | 'groupId'>,
  b: Pick<MenuItemOptionGroup, 'name' | 'groupId'>,
) {
  return a.groupId && b.groupId ? a.groupId === b.groupId : a.name.trim() === b.name.trim();
}

export const optionBelongsToGroup = (
  option: Pick<MenuItemOption, 'optionGroup' | 'groupId'>,
  group: Pick<MenuItemOptionGroup, 'name' | 'groupId'>,
) => sameOptionGroup({ name: optionGroupName(option), groupId: option.groupId }, group);

export function optionsForVariant(options: MenuItemOption[], variantId: string | null) {
  return options.filter((option) => option.variantId === null || option.variantId === variantId);
}

export function effectiveOptionGroup(rule: MenuItemOptionGroup): MenuItemOptionGroup {
  return new MenuItemOptionGroup(
    rule.name, rule.minSelections, rule.maxSelections, rule.variantId,
    rule.displayOrder, rule.selectionScope ?? 'group', rule.sourceCategoryId ?? null,
    effectiveGroupId(rule), rule.selectionMode ?? 'multiple', rule.requiredTotal ?? null,
    rule.optionPriceOverrides ?? [],
  );
}

export function inheritOptionGroup(rule: MenuItemOptionGroup, groups: MenuItemOptionGroup[]): MenuItemOptionGroup {
  const general = rule.variantId === null ? undefined : groups.find((g) => g.variantId === null && sameOptionGroup(g, rule));
  return general ? {
    ...rule,
    groupId: rule.groupId ?? general.groupId,
    selectionMode: rule.selectionMode ?? general.selectionMode,
    requiredTotal: rule.requiredTotal === undefined ? general.requiredTotal : rule.requiredTotal,
    optionPriceOverrides: rule.optionPriceOverrides ?? general.optionPriceOverrides,
  } : rule;
}

/** Publication and checkout use this derivation without persisting legacy limits. */
export function deriveOptionGroups(
  item: Pick<MenuItem, 'optionGroups'>,
  variants: MenuItemVariant[],
  options: MenuItemOption[],
): MenuItemOptionGroup[] {
  const stored = (item.optionGroups ?? []).map((g) => inheritOptionGroup(g, item.optionGroups ?? []));
  const groups = stored.filter((rule) =>
    (rule.variantId === null || variants.some((v) => v.id === rule.variantId)) &&
    (!!rule.groupId || !!rule.sourceCategoryId ||
      (rule.variantId === null ? options : optionsForVariant(options, rule.variantId))
        .some((option) => optionBelongsToGroup(option, rule))),
  ).map(effectiveOptionGroup);
  for (const variant of variants.length ? variants : [null]) {
    const variantId = variant?.id ?? null;
    for (const [index, option] of optionsForVariant(options, variantId).entries()) {
      const rule = stored.find((g) => g.variantId === variantId && optionBelongsToGroup(option, g))
        ?? stored.find((g) => g.variantId === null && optionBelongsToGroup(option, g));
      const derived = rule ? effectiveOptionGroup(rule) : effectiveOptionGroup(
        new MenuItemOptionGroup(optionGroupName(option), 0, variant?.maxSelections ?? 0,
          variantId, index, 'item', null, option.groupId),
      );
      if (!groups.some((g) => g.variantId === derived.variantId && sameOptionGroup(g, derived)))
        groups.push(derived);
    }
  }
  return groups.sort((a, b) => a.displayOrder - b.displayOrder);
}

export function resolveOptionGroups(
  item: Pick<MenuItem, 'optionGroups'>,
  variants: MenuItemVariant[],
  options: MenuItemOption[],
  variantId: string | null,
): MenuItemOptionGroup[] {
  const derived = deriveOptionGroups(item, variants, options);
  return derived.filter((g) =>
    g.variantId === variantId || (g.variantId === null && !derived.some((specific) =>
      specific.variantId === variantId && sameOptionGroup(specific, g))),
  ).sort((a, b) => a.displayOrder - b.displayOrder);
}

/** Counts distinct choices separately from their integer unit quantities. */
export function validateOptionSelection(
  rules: MenuItemOptionGroup[],
  selected: MenuItemOption[],
  quantities: ReadonlyMap<string, number> = new Map(),
): string | null {
  const counts = new Map<string, number>();
  for (const rule of rules) {
    const choices = selected.filter((option) => optionBelongsToGroup(option, rule));
    const count = choices.length;
    counts.set(effectiveGroupId(rule), count);
    const mode = rule.selectionMode ?? 'multiple';
    if (choices.some((option) => {
      const quantity = quantities.get(option.id) ?? 1;
      return !Number.isSafeInteger(quantity) || quantity < 1 || (mode !== 'quantities' && quantity !== 1);
    })) return `Las cantidades de "${rule.name}" no son válidas.`;
    if (count < rule.minSelections) return `Elegí al menos ${rule.minSelections} en "${rule.name}".`;
    const max = mode === 'single' ? 1 : rule.maxSelections;
    if (max > 0 && count > max) return `Elegí hasta ${max} en "${rule.name}".`;
    if (mode === 'quantities' && (count > 0 || rule.minSelections > 0)) {
      const total = choices.reduce((sum, option) => sum + (quantities.get(option.id) ?? 1), 0);
      if (!Number.isSafeInteger(rule.requiredTotal) || (rule.requiredTotal ?? 0) < 1 || total !== rule.requiredTotal)
        return `Completá ${rule.requiredTotal ?? 0} unidades en "${rule.name}".`;
    }
  }
  const legacy = rules.filter((rule) => rule.selectionScope === 'item');
  const limit = legacy[0]?.maxSelections ?? 0;
  const count = legacy.reduce((total, rule) => total + (counts.get(effectiveGroupId(rule)) ?? 0), 0);
  return limit > 0 && count > limit ? `Elegí hasta ${limit} opciones en total para este tamaño.` : null;
}

export function validateOptionGroupConfiguration(
  groups: MenuItemOptionGroup[],
  variants: MenuItemVariant[],
  options: MenuItemOption[],
): string | null {
  const keys = new Set<string>();
  const names = new Set<string>();
  for (const group of groups) {
    const key = JSON.stringify([effectiveGroupId(group), group.variantId]);
    const nameKey = JSON.stringify([group.name, group.variantId]);
    if (keys.has(key) || names.has(nameKey))
      return `El grupo "${group.name}" tiene reglas repetidas para el mismo tamaño.`;
    keys.add(key);
    names.add(nameKey);
    const mode = group.selectionMode ?? 'multiple';
    if (!['single', 'multiple', 'quantities'].includes(mode)) return 'La modalidad de selección no es válida.';
    if (![group.minSelections, group.maxSelections].every((n) => Number.isSafeInteger(n) && n >= 0))
      return 'Los límites deben ser enteros no negativos.';
    if (group.maxSelections > 0 && group.minSelections > group.maxSelections)
      return `El mínimo de "${group.name}" no puede superar el máximo.`;
    if (mode === 'single' && (group.minSelections > 1 || group.maxSelections !== 1))
      return `"${group.name}" permite una sola opción; usá máximo 1 y mínimo 0 o 1.`;
    if (mode === 'quantities') {
      if (!Number.isSafeInteger(group.requiredTotal) || (group.requiredTotal ?? 0) < 1)
        return `Indicá el total de unidades de "${group.name}".`;
      if (group.minSelections > group.requiredTotal!) return 'El mínimo de variedades no puede superar el total de unidades.';
    } else if (group.requiredTotal != null) return 'El total de unidades solo se usa en grupos de cantidades.';
    const overrideIds = new Set<string>();
    for (const override of group.optionPriceOverrides ?? []) {
      if (!group.sourceCategoryId || !Number.isFinite(override.priceDelta) || overrideIds.has(override.sourceItemId) ||
        !options.some((o) => o.sourceItemId === override.sourceItemId && optionBelongsToGroup(o, group)))
        return `Los ajustes de precio de "${group.name}" deben referenciar opciones de su lista, sin repetidos.`;
      overrideIds.add(override.sourceItemId);
    }
    if (group.variantId !== null && !variants.some((v) => v.id === group.variantId))
      return 'El tamaño elegido ya no existe en este producto.';
    const scopes = group.variantId !== null ? [group.variantId] : variants.length ? variants.map((v) => v.id) : [null];
    for (const variantId of scopes) {
      if (group.variantId === null && variantId !== null && groups.some((g) => g.variantId === variantId && sameOptionGroup(g, group))) continue;
      const candidates = optionsForVariant(options, variantId).filter((o) => optionBelongsToGroup(o, group));
      const available = candidates.filter((o) => o.isAvailable).length;
      if (group.minSelections > available) {
        const size = variants.find((v) => v.id === variantId)?.name;
        return `"${group.name}"${size ? ` (${size})` : ''} tiene ${available} opciones disponibles. El mínimo no puede ser mayor.`;
      }
    }
  }
  return null;
}
