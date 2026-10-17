import 'dotenv/config';
import mongoose from 'mongoose';
import { concepcionInventory } from './concepcion-inventory.js';
import { importDirectoryInventory } from './directory-inventory.js';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.some((arg) => !['--apply', '--dry-run', '--help'].includes(arg)))
    throw new Error('Opción desconocida. Usá --help.');
  if (args.includes('--apply') && args.includes('--dry-run'))
    throw new Error('Elegí --apply o --dry-run');
  if (args.includes('--help')) {
    console.log('Uso: npm run seed:concepcion -- [--dry-run | --apply]');
    console.log(
      'Por defecto valida sin conexión a MongoDB. --apply sólo completa huecos de inventario; protege dueños y conserva cartas, imágenes, horarios y configuración.',
    );
    return;
  }

  // Validar el lote completo antes de conectarse. El modo por defecto no escribe.
  const rows = concepcionInventory();
  if (!args.includes('--apply')) {
    console.table(
      rows.map((row) => ({
        slug: row.slug,
        phone: row.phone ? 'presente' : 'pendiente',
        coordinates: row.coordinates ? 'presentes' : 'pendientes',
        images: 'pendientes',
      })),
    );
    console.log(
      `${rows.length} registros válidos. Sin conexión ni cambios. Este lote no representa un relevamiento completo de la ciudad.`,
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
    error instanceof Error
      ? error.message
      : 'Falló la importación de Concepción',
  );
  process.exitCode = 1;
});
