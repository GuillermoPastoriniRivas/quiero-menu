import type { MenuCategory } from '../entities/menu-category.entity.js';
import type { MenuItemComponent } from '../entities/menu-item-component.entity.js';
import type { MenuItem } from '../entities/menu-item.entity.js';
import type { MenuItemVariant } from '../entities/menu-item-variant.entity.js';
import { MenuItemType } from '../enums/menu-item-type.enum.js';

export function componentsForVariant(
  components: MenuItemComponent[],
  variantId: string | null,
) {
  return components
    .filter(
      (slot) =>
        slot.parentVariantId === variantId ||
        (slot.parentVariantId === null &&
          !components.some(
            (specific) =>
              specific.slotId === slot.slotId &&
              specific.parentVariantId === variantId,
          )),
    )
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

/** Availability is deliberately rechecked at checkout, rather than freezing inventory here. */
export function validateMenuComponents(
  parent: MenuItem,
  components: MenuItemComponent[],
  categories: MenuCategory[],
  items: MenuItem[],
  variants: MenuItemVariant[],
): string | null {
  if (
    components.length &&
    categories.some((c) => c.id === parent.categoryId && c.isOptionSource)
  )
    return 'Una opción de una lista no puede tener componentes de promo.';
  if (
    components.length &&
    items.some(
      (item) =>
        item.id !== parent.id &&
        item.components?.some((slot) =>
          slot.choices.some((choice) => choice.menuItemId === parent.id),
        ),
    )
  )
    return 'Este producto ya se usa dentro de una promo; quitá esa referencia antes de agregarle componentes.';
  const keys = new Set<string>();
  for (const slot of components) {
    const key = JSON.stringify([slot.slotId, slot.parentVariantId]);
    if (!slot.slotId.trim() || !slot.name.trim() || keys.has(key))
      return 'Los componentes necesitan ID y nombre, sin slots repetidos para el mismo tamaño.';
    keys.add(key);
    if (
      !Number.isSafeInteger(slot.quantity) ||
      slot.quantity < 1 ||
      !slot.choices.length
    )
      return 'Cada componente necesita una cantidad entera positiva y al menos una elección.';
    if (
      slot.parentVariantId !== null &&
      !variants.some(
        (v) => v.itemId === parent.id && v.id === slot.parentVariantId,
      )
    )
      return 'El tamaño de la promo no pertenece a este producto.';
    const choices = new Set<string>();
    for (const choice of slot.choices) {
      const choiceKey = JSON.stringify([choice.menuItemId, choice.variantId]);
      if (choices.has(choiceKey) || !Number.isFinite(choice.priceDelta))
        return 'Hay elecciones repetidas o precios inválidos en un componente.';
      choices.add(choiceKey);
      const item = items.find((i) => i.id === choice.menuItemId);
      const category = categories.find(
        (c) =>
          c.id === item?.categoryId && c.restaurantId === parent.restaurantId,
      );
      if (
        !item ||
        item.restaurantId !== parent.restaurantId ||
        !category ||
        category.isOptionSource ||
        item.id === parent.id
      )
        return 'Los componentes deben referenciar productos vendibles de este local.';
      if (item.components?.length || item.itemType === MenuItemType.COMBO)
        return 'Una promo no puede incluir otra promo o combo.';
      const itemVariants = variants.filter((v) => v.itemId === item.id);
      if (
        (itemVariants.length > 0 &&
          !itemVariants.some((v) => v.id === choice.variantId)) ||
        (choice.variantId !== null &&
          !itemVariants.some((v) => v.id === choice.variantId))
      )
        return 'Elegí una presentación válida para cada producto del componente.';
    }
  }
  return null;
}
