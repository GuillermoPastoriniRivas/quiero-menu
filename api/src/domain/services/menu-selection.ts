import type { MenuItem } from '../entities/menu-item.entity.js';
import type { MenuItemOption } from '../entities/menu-item-option.entity.js';
import type { MenuItemVariant } from '../entities/menu-item-variant.entity.js';
import type { SelectedOption } from '../entities/order-item.entity.js';
import {
  effectiveGroupId,
  optionBelongsToGroup,
  resolveOptionGroups,
  validateOptionSelection,
} from './menu-option-groups.js';

export interface SelectedOptionInput {
  groupId: string;
  optionId: string;
  quantity: number;
}

/** One price/selection policy for ordinary products and each independent promo slot. */
export function resolveMenuSelection(
  item: MenuItem,
  variants: MenuItemVariant[],
  options: MenuItemOption[],
  variantId: string | null,
  input: {
    selectedOptions?: SelectedOptionInput[];
    selectedOptionIds?: string[];
  },
): { selectedOptions: SelectedOption[]; priceDelta: number } | string {
  if (
    input.selectedOptions !== undefined &&
    (input.selectedOptionIds?.length ?? 0) > 0
  )
    return 'Usá selectedOptions o selectedOptionIds, no ambos.';
  const rules = resolveOptionGroups(item, variants, options, variantId);
  const selected: MenuItemOption[] = [];
  const quantities = new Map<string, number>();
  const identities = new Set<string>();
  const snapshots: SelectedOption[] = [];
  const inputs =
    input.selectedOptions ??
    (input.selectedOptionIds ?? []).map((optionId) => ({
      optionId,
      quantity: 1,
      groupId: undefined,
    }));
  for (const choice of inputs) {
    const rule =
      choice.groupId === undefined
        ? undefined
        : rules.find((g) => effectiveGroupId(g) === choice.groupId);
    if (choice.groupId !== undefined && !rule)
      return 'El grupo elegido ya no existe para este tamaño.';
    const candidates = options.filter(
      (option) =>
        (option.id === choice.optionId ||
          (choice.groupId !== undefined &&
            option.sourceItemId === choice.optionId)) &&
        (option.variantId === null || option.variantId === variantId) &&
        (!rule || optionBelongsToGroup(option, rule)),
    );
    if (candidates.length !== 1)
      return 'Algunas opciones ya no están disponibles. Revisá tu selección.';
    const option = candidates[0];
    const group = rule ?? rules.find((g) => optionBelongsToGroup(option, g));
    if (!group || option.itemId !== item.id || !option.isAvailable)
      return 'Algunas opciones ya no están disponibles. Revisá tu selección.';
    const identity = JSON.stringify([
      effectiveGroupId(group),
      option.sourceItemId ?? option.id,
    ]);
    if (identities.has(identity))
      return 'No repitas una opción dentro del mismo grupo; indicá su cantidad.';
    if (
      !Number.isSafeInteger(choice.quantity) ||
      choice.quantity < 1 ||
      !Number.isFinite(option.priceDelta)
    )
      return 'Las cantidades o precios de las opciones no son válidos.';
    identities.add(identity);
    selected.push(option);
    quantities.set(option.id, choice.quantity);
    snapshots.push({
      optionId: option.sourceItemId ?? option.id,
      name: option.name,
      priceDelta: option.priceDelta,
      quantity: choice.quantity,
      groupId: effectiveGroupId(group),
      groupName: group.name,
      ...(option.sourceItemId ? { sourceItemId: option.sourceItemId } : {}),
    });
  }
  const error = validateOptionSelection(rules, selected, quantities);
  if (error) return error;
  const priceDelta = snapshots.reduce(
    (sum, option) => sum + option.priceDelta * (option.quantity ?? 1),
    0,
  );
  return Number.isFinite(priceDelta)
    ? { selectedOptions: snapshots, priceDelta }
    : 'El precio de las opciones no es válido.';
}
