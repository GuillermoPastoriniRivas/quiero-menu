export interface RestaurantCategoryDef {
  value: string;
  /** Etiqueta singular para UI: "Pizzería" */
  label: string;
  /** Slug plural para URLs de directorio: /en/{ciudad}/pizzerias */
  plural: string;
  /** Etiqueta plural para títulos SEO: "Pizzerías" */
  pluralLabel: string;
  /** Valor para schema.org servesCuisine */
  cuisine: string;
}

/**
 * Taxonomía de rubros del directorio. Debe matchear la copia en
 * api/src/domain/constants/restaurant-categories.ts.
 */
export const RESTAURANT_CATEGORIES: RestaurantCategoryDef[] = [
  {
    value: "pizzeria",
    label: "Pizzería",
    plural: "pizzerias",
    pluralLabel: "Pizzerías",
    cuisine: "Pizza",
  },
  {
    value: "hamburgueseria",
    label: "Hamburguesería",
    plural: "hamburgueserias",
    pluralLabel: "Hamburgueserías",
    cuisine: "Hamburguesas",
  },
  {
    value: "rotiseria",
    label: "Rotisería",
    plural: "rotiserias",
    pluralLabel: "Rotiserías",
    cuisine: "Comida casera",
  },
  {
    value: "empanaderia",
    label: "Empanadería",
    plural: "empanaderias",
    pluralLabel: "Empanaderías",
    cuisine: "Empanadas",
  },
  {
    value: "cafe",
    label: "Café",
    plural: "cafes",
    pluralLabel: "Cafés",
    cuisine: "Café",
  },
  {
    value: "heladeria",
    label: "Heladería",
    plural: "heladerias",
    pluralLabel: "Heladerías",
    cuisine: "Helado",
  },
  {
    value: "sushi",
    label: "Sushi",
    plural: "sushi",
    pluralLabel: "Sushi",
    cuisine: "Sushi",
  },
  { value: "bar", label: "Bar", plural: "bares", pluralLabel: "Bares", cuisine: "Bar" },
  {
    value: "otro",
    label: "Otro",
    plural: "otros",
    pluralLabel: "Otros",
    cuisine: "Comida",
  },
];

export function getCategoryDef(value?: string | null): RestaurantCategoryDef | null {
  if (!value) return null;
  return RESTAURANT_CATEGORIES.find((c) => c.value === value) ?? null;
}

/** Rubros con página propia en el directorio (excluye "otro"). */
export function getDirectoryCategoryByPlural(
  plural: string,
): RestaurantCategoryDef | null {
  return (
    RESTAURANT_CATEGORIES.find(
      (c) => c.plural === plural && c.value !== "otro",
    ) ?? null
  );
}

/** Normaliza un texto a slug URL-safe (misma regla que el API para citySlug). */
export function slugifyCity(city: string): string {
  return city
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatUpdatedDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
