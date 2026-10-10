import {
  deriveOptionGroups,
  resolveOptionGroups,
  validateOptionSelection,
  validateOptionGroupConfiguration,
} from './menu-option-groups.js';
import { MenuItem } from '../entities/menu-item.entity.js';
import { MenuItemOptionGroup } from '../entities/menu-item-option-group.entity.js';
import { MenuItemOption } from '../entities/menu-item-option.entity.js';
import { MenuItemVariant } from '../entities/menu-item-variant.entity.js';
import { MenuItemType } from '../enums/menu-item-type.enum.js';

function item(groups: MenuItemOptionGroup[] = []): MenuItem {
  return new MenuItem(
    'm1',
    'r1',
    'c1',
    '1 Kg',
    '',
    0,
    '',
    0,
    true,
    true,
    MenuItemType.SIMPLE,
    groups,
  );
}

function option(id: string, group: string): MenuItemOption {
  return new MenuItemOption(id, 'm1', null, 'Sabor', 0, group, true);
}

function variant(maxSelections: number): MenuItemVariant {
  return new MenuItemVariant('v1', 'm1', '1 Kg', null, maxSelections, 0);
}

describe('deriveOptionGroups', () => {
  it('conserva la regla general editable cuando todos los tamaños tienen overrides', () => {
    const configured = item([
      new MenuItemOptionGroup('Clasicos', 0, 4, null),
      new MenuItemOptionGroup('Clasicos', 1, 1, 'v1'),
    ]);
    const groups = deriveOptionGroups(
      configured,
      [variant(3)],
      [option('o1', 'Clasicos')],
    );
    expect(groups.find((g) => g.variantId === null)?.maxSelections).toBe(4);
    expect(
      resolveOptionGroups(
        configured,
        [variant(3)],
        [option('o1', 'Clasicos')],
        'v1',
      )[0].maxSelections,
    ).toBe(1);
  });
  it('sin reglas guardadas ni variantes => ilimitado (max 0)', () => {
    const groups = deriveOptionGroups(
      item(),
      [],
      [option('o1', 'Clasicos'), option('o2', 'Clasicos')],
    );
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({
      name: 'Clasicos',
      minSelections: 0,
      maxSelections: 0,
    });
  });

  it('sin reglas guardadas pero con variantes => tope heredado de la variante', () => {
    const groups = deriveOptionGroups(
      item(),
      [variant(3)],
      [option('o1', 'Clasicos')],
    );
    expect(groups[0].maxSelections).toBe(3);
  });

  it('usa la regla guardada cuando existe', () => {
    const groups = deriveOptionGroups(
      item([new MenuItemOptionGroup('Clasicos', 2, 4, null, 0)]),
      [],
      [option('o1', 'Clasicos')],
    );
    expect(groups[0]).toMatchObject({
      name: 'Clasicos',
      minSelections: 2,
      maxSelections: 4,
    });
  });

  it('omite reglas de grupos que ya no tienen opciones', () => {
    const groups = deriveOptionGroups(
      item([new MenuItemOptionGroup('Viejo', 0, 1, null, 0)]),
      [],
      [option('o1', 'Clasicos')],
    );
    expect(groups.map((g) => g.name)).toEqual(['Clasicos']);
  });
  it('mantiene topes diferentes por variante y comparte el tope legacy entre grupos', () => {
    const small = new MenuItemVariant('small', 'm1', '1/4 Kg', null, 1, 0);
    const large = new MenuItemVariant('large', 'm1', '1 Kg', null, 4, 1);
    const options = [option('o1', 'Clasicos'), option('o2', 'Premium')];
    const groups = deriveOptionGroups(item(), [small, large], options);
    expect(
      groups.filter((g) => g.variantId === 'small').map((g) => g.maxSelections),
    ).toEqual([1, 1]);
    expect(
      groups.filter((g) => g.variantId === 'large').map((g) => g.maxSelections),
    ).toEqual([4, 4]);
    expect(
      validateOptionSelection(
        resolveOptionGroups(item(), [small, large], options, 'small'),
        options,
      ),
    ).toContain('en total');
    expect(
      validateOptionSelection(
        resolveOptionGroups(item(), [small, large], options, 'large'),
        options,
      ),
    ).toBeNull();
  });

  it('resuelve específicas antes que generales y mantiene grupos agotados', () => {
    const required = item([
      new MenuItemOptionGroup('Clasicos', 2, 3, null, 0),
      new MenuItemOptionGroup('Clasicos', 1, 1, 'v1', 0),
    ]);
    const soldOut = new MenuItemOption(
      'o1',
      'm1',
      null,
      'Chocolate',
      0,
      'Clasicos',
      false,
    );
    const rules = resolveOptionGroups(required, [variant(4)], [soldOut], 'v1');
    expect(rules).toHaveLength(1);
    expect(rules[0].minSelections).toBe(1);
    expect(validateOptionSelection(rules, [])).not.toBeNull();
  });

  it('no exige un grupo huérfano aunque su regla histórica sea obligatoria', () => {
    expect(
      resolveOptionGroups(
        item([new MenuItemOptionGroup('Viejo', 1, 1, null, 0)]),
        [],
        [],
        null,
      ),
    ).toEqual([]);
  });

  it('rechaza mínimo mayor al máximo, opciones insuficientes, reglas duplicadas y tamaños ajenos', () => {
    const options = [option('o1', 'Clasicos')];
    for (const groups of [
      [new MenuItemOptionGroup('Clasicos', 3, 2, null, 0)],
      [new MenuItemOptionGroup('Clasicos', 2, 0, null, 0)],
      [new MenuItemOptionGroup('Clasicos', 0, 0, 'ajeno', 0)],
      [
        new MenuItemOptionGroup('Clasicos', 0, 1, null, 0),
        new MenuItemOptionGroup('Clasicos', 1, 1, null, 1),
      ],
    ])
      expect(
        validateOptionGroupConfiguration(groups, [], options),
      ).not.toBeNull();
  });
});
