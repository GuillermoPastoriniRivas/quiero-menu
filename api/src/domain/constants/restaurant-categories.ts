import { RestaurantCategory } from '../enums/restaurant-category.enum.js';

export interface RestaurantCategoryDef {
  value: RestaurantCategory;
  /** Etiqueta singular para UI: "Pizzería" */
  label: string;
  /** Slug plural para URLs de directorio: /en/{ciudad}/pizzerias */
  plural: string;
  /** Valor para schema.org servesCuisine */
  cuisine: string;
}

/**
 * Taxonomía de rubros del directorio. Es la única fuente de verdad para
 * URLs de categoría, labels y classification de la IA. Los valores deben
 * matchear la copia en ui/src/lib/restaurant-categories.ts.
 */
export const RESTAURANT_CATEGORIES: RestaurantCategoryDef[] = [
  {
    value: RestaurantCategory.PIZZERIA,
    label: 'Pizzería',
    plural: 'pizzerias',
    cuisine: 'Pizza',
  },
  {
    value: RestaurantCategory.HAMBURGUESERIA,
    label: 'Hamburguesería',
    plural: 'hamburgueserias',
    cuisine: 'Hamburguesas',
  },
  {
    value: RestaurantCategory.ROTISERIA,
    label: 'Rotisería',
    plural: 'rotiserias',
    cuisine: 'Comida casera',
  },
  {
    value: RestaurantCategory.EMPANADERIA,
    label: 'Empanadería',
    plural: 'empanaderias',
    cuisine: 'Empanadas',
  },
  {
    value: RestaurantCategory.CAFE,
    label: 'Café',
    plural: 'cafes',
    cuisine: 'Café',
  },
  {
    value: RestaurantCategory.HELADERIA,
    label: 'Heladería',
    plural: 'heladerias',
    cuisine: 'Helado',
  },
  {
    value: RestaurantCategory.SUSHI,
    label: 'Sushi',
    plural: 'sushi',
    cuisine: 'Sushi',
  },
  {
    value: RestaurantCategory.BAR,
    label: 'Bar',
    plural: 'bares',
    cuisine: 'Bar',
  },
  {
    value: RestaurantCategory.OTRO,
    label: 'Otro',
    plural: 'otros',
    cuisine: 'Comida',
  },
];

export function getCategoryDef(
  value: string | null | undefined,
): RestaurantCategoryDef | null {
  if (!value) return null;
  return (
    RESTAURANT_CATEGORIES.find((c) => String(c.value) === String(value)) ?? null
  );
}
