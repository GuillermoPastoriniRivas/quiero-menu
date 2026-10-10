/**
 * Regla de selección para un grupo de opciones de un producto.
 *
 * - `name` coincide con `MenuItemOption.optionGroup` (ej. "Clasicos").
 * - `minSelections` 0 = opcional, >0 = mínimo exigido al agregar al carrito.
 * - `maxSelections` 0 = ilimitado, >0 = tope de selecciones.
 * - `variantId` permite atar la regla a una variante puntual (null = todas).
 */
export class MenuItemOptionGroup {
  public readonly selectionScope?: 'group' | 'item';
  constructor(
    public readonly name: string,
    public readonly minSelections: number,
    public readonly maxSelections: number,
    public readonly variantId: string | null = null,
    public readonly displayOrder: number = 0,
    /** Solo en reglas derivadas: el tope histórico se comparte entre grupos. */
    selectionScope: 'group' | 'item' = 'group',
    public readonly sourceCategoryId: string | null = null,
  ) {
    this.selectionScope = selectionScope;
  }
}
