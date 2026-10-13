import type { MenuCategory, MenuItem, MenuItemOption, MenuItemOptionGroup, MenuItemVariant, StorefrontData } from '@/types';

// Additive aliases while the shared contract is being integrated by the API/storefront agent.
export type EditorVariant = MenuItemVariant & { isAvailable?: boolean };
export type EditorOption = MenuItemOption & { groupId?: string };
export type EditorGroup = MenuItemOptionGroup & {
  groupId?: string;
  selectionMode?: 'single' | 'multiple' | 'quantities';
  requiredTotal?: number | null;
  optionPriceOverrides?: { sourceItemId: string; priceDelta: number }[];
};
export type PromoComponent = {
  slotId: string;
  name: string;
  displayOrder: number;
  parentVariantId: string | null;
  quantity: number;
  choices: { menuItemId: string; variantId: string | null; priceDelta: number }[];
};
export type EditorItem = MenuItem & {
  variants: EditorVariant[];
  options: EditorOption[];
  optionGroups?: EditorGroup[];
  resolvedOptions?: EditorOption[];
  effectiveOptionGroups?: EditorGroup[];
  components?: PromoComponent[];
};
export type EditorCategory = MenuCategory & { items: EditorItem[] };
export type EditorMenu = Omit<StorefrontData, 'categories'> & { categories: EditorCategory[] };

export const groupName = (option: Pick<MenuItemOption, 'optionGroup'>) => option.optionGroup.trim() || 'Extras';
export const sameGroup = (a: Pick<EditorGroup, 'name' | 'groupId'>, b: Pick<EditorGroup, 'name' | 'groupId'>) =>
  a.groupId && b.groupId ? a.groupId === b.groupId : a.name === b.name;
export const optionInGroup = (option: EditorOption, group: EditorGroup) =>
  sameGroup({ name: groupName(option), groupId: option.groupId }, group);

/** Stored rules AND local options: an empty/deleted source must remain editable. */
export function editorGroupRows(item: EditorItem): { key: string; rule: EditorGroup; options: EditorOption[] }[] {
  const rules = [...(item.optionGroups ?? [])];
  for (const option of item.options) {
    const identity = { name: groupName(option), groupId: option.groupId };
    if (rules.some((g) => sameGroup(g, identity) && (g.variantId === option.variantId || g.variantId === null))) continue;
    const effective = item.effectiveOptionGroups?.find((g) => sameGroup(g, identity) && g.variantId === option.variantId);
    rules.push({ ...identity, minSelections: 0, maxSelections: 0, displayOrder: rules.length, ...effective, variantId: option.variantId });
  }
  return rules.sort((a, b) => a.displayOrder - b.displayOrder).map((rule) => ({
    key: JSON.stringify([rule.groupId || rule.name, rule.variantId]),
    rule,
    options: item.options.filter((o) => optionInGroup(o, rule) && (o.variantId === null || o.variantId === rule.variantId)),
  }));
}

export function sharedListUses(categories: EditorCategory[], sourceId: string) {
  return categories.filter((c) => !c.isOptionSource).flatMap((c) => c.items.flatMap((item) =>
    (item.optionGroups ?? []).filter((g) => g.sourceCategoryId === sourceId).map((group) => ({ item, group })),
  ));
}

export function sourceShadowsLocal(item: EditorItem, group: string, variantId: string | null, groupId?: string) {
  return (item.optionGroups ?? []).some((g) => sameGroup(g, { name: group, groupId }) && g.sourceCategoryId && (g.variantId === null || g.variantId === variantId));
}

export function componentIssue(components: PromoComponent[], item: EditorItem, categories: EditorCategory[]): string {
  const catalog = categories.filter((c) => !c.isOptionSource).flatMap((c) => c.items);
  const ids = new Set<string>();
  for (const slot of components) {
    if (!slot.slotId || ids.has(slot.slotId)) return 'Cada componente necesita una identidad diferente.';
    ids.add(slot.slotId);
    if (!slot.name.trim()) return 'Dale un nombre a cada componente (por ejemplo, Bebida 1).';
    if (!Number.isSafeInteger(slot.quantity) || slot.quantity < 1) return `Revisá la cantidad de ${slot.name}.`;
    if (slot.parentVariantId && !item.variants.some((v) => v.id === slot.parentVariantId)) return `La presentación de ${slot.name} ya no existe.`;
    if (!slot.choices.length) return `Agregá al menos una elección a ${slot.name}.`;
    const choices = new Set<string>();
    for (const choice of slot.choices) {
      const product = catalog.find((p) => p.id === choice.menuItemId);
      if (!product || product.id === item.id || product.isOrderable === false || product.components?.length) return `Elegí un producto vendible sin componentes en ${slot.name}.`;
      if (product.restaurantId !== item.restaurantId) return 'Las elecciones deben ser de este local.';
      if ((product.variants.length > 0 && !choice.variantId) || (choice.variantId && !product.variants.some((v) => v.id === choice.variantId))) return `Elegí una presentación válida de ${product.name}.`;
      const key = JSON.stringify([choice.menuItemId, choice.variantId]);
      if (choices.has(key)) return `Hay una elección repetida dentro de ${slot.name}. Podés repetirla en otro componente.`;
      choices.add(key);
      if (!Number.isSafeInteger(choice.priceDelta) || choice.priceDelta < 0) return `Revisá el precio extra de ${product.name}.`;
    }
  }
  return '';
}
