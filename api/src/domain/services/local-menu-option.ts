import type { MenuItem } from '../entities/menu-item.entity.js';
import type { MenuItemOption } from '../entities/menu-item-option.entity.js';
import type { MenuItemVariant } from '../entities/menu-item-variant.entity.js';
import { effectiveGroupId, optionBelongsToGroup } from './menu-option-groups.js';

export function validateLocalMenuOption(item: MenuItem, option: Omit<MenuItemOption, 'id'>, variants: MenuItemVariant[]) {
  if (option.variantId !== null && !variants.some((v) => v.id === option.variantId && v.itemId === item.id))
    return 'La presentación elegida no pertenece a este producto.';
  const groups = (item.optionGroups ?? []).filter((g) => optionBelongsToGroup(option, g));
  if (option.groupId && !groups.length && option.groupId !== effectiveGroupId({ name: option.optionGroup }))
    return 'El grupo elegido no pertenece a este producto.';
  const scopes = option.variantId === null ? (variants.length ? variants.map((v) => v.id) : [null]) : [option.variantId];
  for (const variantId of scopes) {
    const rule = groups.find((g) => g.variantId === variantId) ?? groups.find((g) => g.variantId === null);
    if (rule?.sourceCategoryId)
      return 'Este grupo usa una lista compartida. Editá la opción en la lista o desvinculá el grupo antes de agregar opciones locales.';
  }
  return null;
}
