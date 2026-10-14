import 'dotenv/config';
import mongoose from 'mongoose';

/**
 * Marca como demo (isDemo: true) los locales ficticios creados por
 * seed-demo-locals.ts. Los demos quedan fuera de TODA superficie pública
 * (directorio, búsqueda, sitemap y ficha) sin borrarlos, para conservarlos en
 * admin y desarrollo.
 *
 * Idempotente: se puede correr las veces que haga falta. La lista de slugs es
 * la misma que el seed; si el seed agrega demos, agregar acá también.
 */
const DEMO_SLUGS = [
  'heladeria-manhattan',
  'rotiseria-dona-clara',
  'hamburgueseria-el-ojin',
  'pizzeria-la-barca',
];

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI no está definida');

  await mongoose.connect(uri);
  const restaurants = mongoose.connection.collection('restaurants');

  const result = await restaurants.updateMany(
    { slug: { $in: DEMO_SLUGS } },
    { $set: { isDemo: true, updatedAt: new Date() } },
  );

  const found = await restaurants
    .find(
      { slug: { $in: DEMO_SLUGS } },
      { projection: { slug: 1, isDemo: 1, claimed: 1 } },
    )
    .toArray();

  console.log(
    `Demos marcados: matched=${result.matchedCount} modified=${result.modifiedCount}`,
  );
  for (const doc of found) {
    console.log(
      `  ${String(doc.slug)} isDemo=${String(doc.isDemo)} claimed=${String(doc.claimed)}`,
    );
  }
  if (found.length !== DEMO_SLUGS.length) {
    console.warn(
      `Aviso: se esperaban ${DEMO_SLUGS.length} slugs y se encontraron ${found.length}`,
    );
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
