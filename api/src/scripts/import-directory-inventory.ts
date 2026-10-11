import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import mongoose from 'mongoose';
import {
  importDirectoryInventory,
  InventoryBatchSchema,
} from './directory-inventory.js';

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log(
      'Uso: npm run import:directory -- --file inventario.json [--apply | --dry-run]',
    );
    console.log(
      'Sin --apply solo valida el JSON, sin conectarse a MongoDB. --apply usa MONGODB_URI y protege locales con dueño.',
    );
    console.log(
      'Formato: array de fichas con slug, name, city, category y sourceUrls. country: AR/UY/CO; region requerida para ciudades desconocidas. coordinates: {lat,lng} opcional, debe provenir de datos comprobados.',
    );
    console.log(
      'Ejemplo:',
      JSON.stringify(
        [
          {
            slug: 'panaderia-ejemplo',
            name: 'Panadería Ejemplo',
            city: 'Resistencia',
            country: 'AR',
            category: 'panaderia',
            sourceUrls: ['https://example.com/local'],
          },
        ],
        null,
        2,
      ),
    );
    return;
  }
  const fileIndex = args.indexOf('--file');
  const file = fileIndex >= 0 ? args[fileIndex + 1] : undefined;
  if (!file || file.startsWith('--'))
    throw new Error(
      'Uso: npm run import:directory -- --file inventario.json [--apply]',
    );
  if (
    args.some((arg) => !['--file', '--apply', '--dry-run', file].includes(arg))
  )
    throw new Error('Opción desconocida');
  if (args.includes('--apply') && args.includes('--dry-run'))
    throw new Error('Elegí --apply o --dry-run');
  const rows = InventoryBatchSchema.parse(
    JSON.parse(await readFile(file, 'utf8')),
  );
  if (!args.includes('--apply')) {
    console.table(
      rows.map((r) => ({
        slug: r.slug,
        city: r.city,
        category: r.category,
        coordinates: r.coordinates ? 'cargadas' : 'pendientes',
      })),
    );
    console.log(
      `${rows.length} fichas válidas. Sin cambios ni conexión a Mongo. --apply revisa duplicados/dueños y aplica la importación.`,
    );
    return;
  }
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI no está definida');
  await mongoose.connect(uri);
  try {
    console.table(
      await importDirectoryInventory(mongoose.connection.db!, rows, true),
    );
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : 'Falló la importación',
  );
  process.exitCode = 1;
});
