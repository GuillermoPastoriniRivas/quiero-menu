import type { MenuItem } from '../entities/menu-item.entity.js';
import type { MenuItemOption } from '../entities/menu-item-option.entity.js';
import { MenuItemOptionGroup } from '../entities/menu-item-option-group.entity.js';
import type { MenuItemVariant } from '../entities/menu-item-variant.entity.js';

export const optionGroupName = (option: Pick<MenuItemOption, 'optionGroup'>) =>
  option.optionGroup.trim() || 'Extras';

export function optionsForVariant(
  options: MenuItemOption[],
  variantId: string | null,
) {
  return options.filter(
    (option) => option.variantId === null || option.variantId === variantId,
  );
}

/** Publicación y checkout usan la misma derivación, sin persistir reglas legacy. */
export function deriveOptionGroups(
  item: Pick<MenuItem, 'optionGroups'>,
  variants: MenuItemVariant[],
  options: MenuItemOption[],
): MenuItemOptionGroup[] {
  const stored = item.optionGroups ?? [];
  // Conserva también la regla general cuando todos los tamaños tienen overrides:
  // el editor debe poder recuperar la herencia sin perder la configuración.
  const groups = stored
    .filter(
      (rule) =>
        (rule.variantId === null ||
          variants.some((variant) => variant.id === rule.variantId)) &&
        (!!rule.sourceCategoryId ||
          (rule.variantId === null
            ? options
            : optionsForVariant(options, rule.variantId)
          ).some((option) => optionGroupName(option) === rule.name)),
    )
    .map(
      (rule) =>
        new MenuItemOptionGroup(
          rule.name,
          rule.minSelections,
          rule.maxSelections,
          rule.variantId,
          rule.displayOrder,
          'group',
          rule.sourceCategoryId,
        ),
    );
  const scopes = variants.length ? variants : [null];
  for (const variant of scopes) {
    const variantId = variant?.id ?? null;
    const names = [
      ...new Set(optionsForVariant(options, variantId).map(optionGroupName)),
    ];
    for (const [index, name] of names.entries()) {
      const rule =
        stored.find((g) => g.name === name && g.variantId === variantId) ??
        stored.find((g) => g.name === name && g.variantId === null);
      const derived = rule
        ? new MenuItemOptionGroup(
            name,
            rule.minSelections,
            rule.maxSelections,
            rule.variantId,
            rule.displayOrder,
            'group',
            rule.sourceCategoryId,
          )
        : new MenuItemOptionGroup(
            name,
            0,
            variant?.maxSelections ?? 0,
            variantId,
            index,
            'item',
          );
      if (
        !groups.some(
          (g) => g.name === name && g.variantId === derived.variantId,
        )
      )
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
  const names = [
    ...new Set([
      ...optionsForVariant(options, variantId).map(optionGroupName),
      ...(item.optionGroups ?? [])
        .filter(
          (g) =>
            g.sourceCategoryId &&
            (g.variantId === null || g.variantId === variantId),
        )
        .map((g) => g.name),
    ]),
  ];
  return names
    .flatMap((name) => {
      const rule =
        derived.find((g) => g.name === name && g.variantId === variantId) ??
        derived.find((g) => g.name === name && g.variantId === null);
      return rule ? [rule] : [];
    })
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

/** Devuelve un mensaje accionable; cuenta únicamente opciones resueltas y únicas. */
export function validateOptionSelection(
  rules: MenuItemOptionGroup[],
  selected: MenuItemOption[],
): string | null {
  const counts = new Map<string, number>();
  for (const option of selected) {
    const name = optionGroupName(option);
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  for (const rule of rules) {
    const count = counts.get(rule.name) ?? 0;
    if (count < rule.minSelections)
      return `Elegí al menos ${rule.minSelections} en "${rule.name}".`;
    if (rule.maxSelections > 0 && count > rule.maxSelections)
      return `Elegí hasta ${rule.maxSelections} en "${rule.name}".`;
  }
  const legacy = rules.filter((rule) => rule.selectionScope === 'item');
  const limit = legacy[0]?.maxSelections ?? 0;
  const count = legacy.reduce(
    (total, rule) => total + (counts.get(rule.name) ?? 0),
    0,
  );
  return limit > 0 && count > limit
    ? `Elegí hasta ${limit} opciones en total para este tamaño.`
    : null;
}

export function validateOptionGroupConfiguration(
  groups: MenuItemOptionGroup[],
  variants: MenuItemVariant[],
  options: MenuItemOption[],
): string | null {
  const keys = new Set<string>();
  for (const group of groups) {
    const key = JSON.stringify([group.name, group.variantId]);
    if (keys.has(key))
      return `El grupo "${group.name}" tiene reglas repetidas para el mismo tamaño.`;
    keys.add(key);
    if (group.maxSelections > 0 && group.minSelections > group.maxSelections)
      return `El mínimo de "${group.name}" no puede superar el máximo.`;
    if (
      group.variantId !== null &&
      !variants.some((v) => v.id === group.variantId)
    )
      return 'El tamaño elegido ya no existe en este producto.';
    const scopes =
      group.variantId !== null
        ? [group.variantId]
        : variants.length
          ? variants.map((v) => v.id)
          : [null];
    for (const variantId of scopes) {
      // Una regla específica reemplaza la general para ese tamaño.
      if (
        group.variantId === null &&
        variantId !== null &&
        groups.some((g) => g.name === group.name && g.variantId === variantId)
      )
        continue;
      const candidates = optionsForVariant(options, variantId).filter(
        (o) => optionGroupName(o) === group.name,
      );
      if (!candidates.length) {
        const groupExists = (
          group.variantId === null
            ? options
            : optionsForVariant(options, group.variantId)
        ).some((o) => optionGroupName(o) === group.name);
        if (!groupExists && group.minSelections > 0)
          return `El grupo "${group.name}" ya no tiene opciones. Agregá opciones antes de hacerlo obligatorio.`;
        continue;
      }
      const available = candidates.filter((o) => o.isAvailable).length;
      if (group.minSelections > available) {
        const size = variants.find((v) => v.id === variantId)?.name;
        return `"${group.name}"${size ? ` (${size})` : ''} tiene ${available} opciones disponibles. El mínimo no puede ser mayor.`;
      }
    }
  }
  return null;
}
