import { CONCEPCION_DIRECTORY } from '../data/concepcion-uruguay-directory.js';
import { InventoryBatchSchema } from './directory-inventory.js';

/**
 * Inventario del directorio de Concepción del Uruguay: los 50 registros previos
 * enriquecidos más los locales faltantes del directorio oficial de turismo.
 * Sólo datos públicos y verificables en la fuente; no infiere horarios, precios
 * ni imágenes.
 */
export function concepcionInventory() {
  return InventoryBatchSchema.parse(CONCEPCION_DIRECTORY);
}
