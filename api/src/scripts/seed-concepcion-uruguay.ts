import 'dotenv/config';
import mongoose from 'mongoose';

import { CONCEPCION_URUGUAY_50 } from '../data/concepcion-uruguay-50.js';

const CITY_SLUG = 'concepcion-del-uruguay';

interface SeedOptions {
  dryRun: boolean;
}

function parseOptions(): SeedOptions {
  return { dryRun: process.argv.includes('--dry-run') };
}

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI no está definida');

  const { dryRun } = parseOptions();
  if (dryRun) {
    console.log('Modo dry-run: no se escribirá en MongoDB.');
  }

  if (!dryRun) await mongoose.connect(uri);

  try {
    if (dryRun) {
      for (const local of CONCEPCION_URUGUAY_50) {
        const items = local.sections.reduce(
          (total, section) => total + section.items.length,
          0,
        );
        console.log(
          `Validado: ${local.slug} | categoría=${local.category || 'sin clasificar'} | menú=${items} ítems | geo=${local.coordinates ? 'sí' : 'pendiente'}`,
        );
      }
      console.log(`Total validado: ${CONCEPCION_URUGUAY_50.length} locales.`);
      return;
    }

    const db = mongoose.connection;
    const restaurants = db.collection('restaurants');
    const categories = db.collection('menu_categories');
    const items = db.collection('menu_items');
    const hours = db.collection('operating_hours');

    for (const local of CONCEPCION_URUGUAY_50) {
      const existing = await restaurants.findOne({ slug: local.slug });
      const restaurantDoc = {
        slug: local.slug,
        name: local.name,
        description: local.description,
        address: local.address,
        city: 'Concepción del Uruguay',
        citySlug: CITY_SLUG,
        region: 'Entre Ríos',
        regionSlug: 'entre-rios',
        country: 'AR',
        countrySlug: 'argentina',
        category: local.category,
        coordinates: local.coordinates,
        phone: local.phone,
        bannerUrl: '',
        photoGallery: [],
        currency: 'ARS',
        timezone: 'America/Argentina/Buenos_Aires',
        status: 'active',
        claimed: false,
        openOverride: null,
        customDomain: null,
        socialLinks: local.socialLinks,
        updatedAt: new Date(),
      };

      let restaurantId: mongoose.Types.ObjectId;
      if (existing) {
        await restaurants.updateOne(
          { _id: existing._id },
          { $set: restaurantDoc },
        );
        restaurantId = existing._id as mongoose.Types.ObjectId;
      } else {
        const result = await restaurants.insertOne({
          ...restaurantDoc,
          createdAt: new Date(),
        });
        restaurantId = result.insertedId;
      }

      // Estos slugs son propiedad de este seed: se reconstruyen para que el
      // proceso sea repetible y no acumule categorías o ítems duplicados.
      await categories.deleteMany({ restaurantId });
      await items.deleteMany({ restaurantId });
      await hours.deleteMany({ restaurantId });

      for (const [categoryIndex, section] of local.sections.entries()) {
        const category = await categories.insertOne({
          restaurantId,
          name: section.name,
          description: section.description,
          displayOrder: categoryIndex,
          isVisible: true,
        });

        await items.insertMany(
          section.items.map((item, itemIndex) => ({
            restaurantId,
            categoryId: category.insertedId,
            name: item.name,
            description: item.description,
            basePrice: item.basePrice,
            imageUrl: '',
            displayOrder: itemIndex,
            isAvailable: true,
            isVisible: true,
            itemType: 'simple',
          })),
        );
      }

      const itemCount = local.sections.reduce(
        (total, section) => total + section.items.length,
        0,
      );
      console.log(
        `Importado: ${local.slug} (${String(restaurantId)}) | menú=${itemCount} ítems | geo=${local.coordinates ? 'sí' : 'pendiente'}`,
      );
    }

    console.log(
      `Importación completa: ${CONCEPCION_URUGUAY_50.length} locales.`,
    );
  } finally {
    if (!dryRun) await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error('Seed de Concepción del Uruguay falló:', error);
  process.exit(1);
});
