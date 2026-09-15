import 'dotenv/config';
import mongoose from 'mongoose';

/**
 * Seed de DEMO (datos mockeados): dos locales completos de Concepción del
 * Uruguay para mostrar el producto punta a punta en el directorio:
 *  - hamburgueseria-el-ojin (claimed=true, con carta y horarios)
 *  - pizzeria-la-barca (claimed=true, con carta y horarios)
 * Idempotente: borra y recrea menú/horarios de esos slugs; el restaurant se
 * UPSERTEA por slug.
 */

interface MenuItemSeed {
  name: string;
  description: string;
  basePrice: number;
}

interface MenuSectionSeed {
  name: string;
  description: string;
  items: MenuItemSeed[];
}

interface DemoLocalSeed {
  slug: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  category: string;
  /** false = inventario reclamable: muestra la ficha con banner (v0 demo). */
  claimed?: boolean;
  opener: {
    dayOfWeek: number;
    opensAt: string;
    closesAt: string;
    isClosed: boolean;
  }[];
  sections: MenuSectionSeed[];
}

const DEMOS: DemoLocalSeed[] = [
  {
    slug: 'heladeria-manhattan',
    name: 'Heladería Manhattan',
    description:
      'Helado artesanal por kilo y cucuruchos desde 1987. Cremas de dulce de leche granizado, frutilla a la villa y chocolate con avellanas.',
    address: 'Rocamora 882, Concepción del Uruguay',
    phone: '+54 9 3442 553102',
    category: 'heladeria',
    claimed: false,
    opener: [
      { dayOfWeek: 0, opensAt: '11:00', closesAt: '23:30', isClosed: false },
      { dayOfWeek: 1, opensAt: '11:00', closesAt: '23:30', isClosed: false },
      { dayOfWeek: 2, opensAt: '11:00', closesAt: '23:30', isClosed: false },
      { dayOfWeek: 3, opensAt: '11:00', closesAt: '23:30', isClosed: false },
      { dayOfWeek: 4, opensAt: '11:00', closesAt: '00:30', isClosed: false },
      { dayOfWeek: 5, opensAt: '11:00', closesAt: '00:30', isClosed: false },
      { dayOfWeek: 6, opensAt: '11:00', closesAt: '00:30', isClosed: false },
    ],
    sections: [],
  },
  {
    slug: 'hamburgueseria-el-ojin',
    name: 'Hamburguesería El Ojin',
    description:
      'Medallones caseros a la parrilla, pan de brioche horneado en el local y papas rústicas. La doble cheddar es la favorita de la noche.',
    address: 'General Urquiza 1243, Concepción del Uruguay',
    phone: '+54 9 3442 551204',
    category: 'hamburgueseria',
    opener: [
      { dayOfWeek: 0, opensAt: '20:00', closesAt: '23:59', isClosed: false },
      { dayOfWeek: 1, opensAt: '', closesAt: '', isClosed: true },
      { dayOfWeek: 2, opensAt: '20:00', closesAt: '23:59', isClosed: false },
      { dayOfWeek: 3, opensAt: '20:00', closesAt: '23:59', isClosed: false },
      { dayOfWeek: 4, opensAt: '20:00', closesAt: '23:59', isClosed: false },
      { dayOfWeek: 5, opensAt: '20:00', closesAt: '01:30', isClosed: false },
      { dayOfWeek: 6, opensAt: '20:00', closesAt: '01:30', isClosed: false },
    ],
    sections: [
      {
        name: 'Hamburguesas',
        description: 'Panes brioche, carne fresca de icieta y queso estirado',
        items: [
          {
            name: 'El Ojin Simple',
            description: 'Medallón 120g, cheddar, lechuga, tomate y salsa Ojin',
            basePrice: 5800,
          },
          {
            name: 'Doble Cheddar',
            description:
              'Dos medallones 120g, doble cheddar fundido y cebolla en pluma',
            basePrice: 7900,
          },
          {
            name: 'Completa La Famosa',
            description: 'Medallón 150g, jamón, queso, huevo frito y lechuga',
            basePrice: 8500,
          },
          {
            name: 'Bacon Barbecue',
            description:
              'Medallón 150g, panceta crocante, cebolla glaseada y salsa bbq',
            basePrice: 9200,
          },
          {
            name: 'Veggie La Isla',
            description:
              'Medallón de quinoa y lentejas, zanahoria rallada y alioli vegano',
            basePrice: 7400,
          },
        ],
      },
      {
        name: 'Para sumar',
        description: 'Extras y papas',
        items: [
          {
            name: 'Papas Rústicas',
            description: 'Con piel, ajo asado y romero',
            basePrice: 4200,
          },
          {
            name: 'Papas Quadrada',
            description: 'Con cheddar fundido, panceta y verdeo encima',
            basePrice: 6300,
          },
          {
            name: 'Cheddar extra',
            description: 'Lonja extra de cheddar sobre tu hamburguesa',
            basePrice: 800,
          },
          {
            name: 'Panceta crocante',
            description: 'Porción extra de panceta',
            basePrice: 1100,
          },
        ],
      },
      {
        name: 'Bebidas',
        description: '',
        items: [
          {
            name: 'Gaseosa 500ml',
            description: 'Cola, naranja o limón-lima',
            basePrice: 1900,
          },
          {
            name: 'Cerveza litoral 473ml',
            description: 'IPA de Rincón y chopp artesanal',
            basePrice: 3200,
          },
          {
            name: 'Agua 600ml',
            description: 'Con o sin gas',
            basePrice: 1400,
          },
        ],
      },
    ],
  },
  {
    slug: 'pizzeria-la-barca',
    name: 'Pizzería La Barca',
    description:
      'Masa fermentada 48 horas, molde criollo y horno de piedra. Empanadas de leve fritura y las clásicas de balcarce como postre.',
    address: 'Almirante Brown 1890, Concepción del Uruguay',
    phone: '+54 9 3442 557703',
    category: 'pizzeria',
    opener: [
      { dayOfWeek: 0, opensAt: '19:00', closesAt: '23:30', isClosed: false },
      { dayOfWeek: 1, opensAt: '', closesAt: '', isClosed: true },
      { dayOfWeek: 2, opensAt: '', closesAt: '', isClosed: true },
      { dayOfWeek: 3, opensAt: '19:00', closesAt: '23:30', isClosed: false },
      { dayOfWeek: 4, opensAt: '19:00', closesAt: '23:30', isClosed: false },
      { dayOfWeek: 5, opensAt: '19:00', closesAt: '01:00', isClosed: false },
      { dayOfWeek: 6, opensAt: '19:00', closesAt: '01:00', isClosed: false },
    ],
    sections: [
      {
        name: 'Pizzas (8 porciones)',
        description: 'Molde criollo, muzzarella de quesería local',
        items: [
          {
            name: 'Muzzarella Clásica',
            description:
              'Muzzarella, salsa de tomate natural, aceitunas y orégano',
            basePrice: 11500,
          },
          {
            name: 'Especial La Barca',
            description: 'Muzzarella, jamón cocido, tomate fresco y morrón',
            basePrice: 13200,
          },
          {
            name: 'Napolitana',
            description: 'Tomate, ajo confitado, albahaca y muzzarella doble',
            basePrice: 13200,
          },
          {
            name: 'Barbaroche',
            description: 'Muzzarella, panceta, huevo duro y salsa golf',
            basePrice: 14500,
          },
          {
            name: 'Provolone del Porto',
            description:
              'Muzzarella, provolone fundido, aceitunas y ají molido',
            basePrice: 13900,
          },
          {
            name: 'Fugazzeta Rellena',
            description: 'Doble masa, mucho queso fundido y cebolla dorada',
            basePrice: 14800,
          },
        ],
      },
      {
        name: 'Empanadas',
        description: 'Al horno, docena o media docena',
        items: [
          {
            name: 'Media docena',
            description: 'Mix de carne, jamón y queso, pollo y verdura',
            basePrice: 6900,
          },
          {
            name: 'Docena',
            description: 'Doce empanadas, podes pedir los gustos en el cart',
            basePrice: 12800,
          },
        ],
      },
      {
        name: 'Bebidas',
        description: '',
        items: [
          {
            name: 'Gaseosa 1,5l',
            description: 'Cola, naranja o limón-lima',
            basePrice: 3100,
          },
          {
            name: 'Cerveza 1l',
            description: 'Rubia tirada en chopp para pedir con la pizza',
            basePrice: 4900,
          },
        ],
      },
    ],
  },
];

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI no está definida');

  await mongoose.connect(uri);
  const db = mongoose.connection;
  const restaurants = db.collection('restaurants');
  const categories = db.collection('menu_categories');
  const items = db.collection('menu_items');
  const hours = db.collection('operating_hours');

  for (const demo of DEMOS) {
    const filter = { slug: demo.slug };
    const existing = await restaurants.findOne(filter);

    const restaurantDoc = {
      ...existing,
      slug: demo.slug,
      name: demo.name,
      description: demo.description,
      address: demo.address,
      city: 'Concepción del Uruguay',
      citySlug: 'concepcion-del-uruguay',
      region: 'Entre Ríos',
      regionSlug: 'entre-rios',
      country: 'AR',
      countrySlug: 'argentina',
      category: demo.category,
      phone: demo.phone,
      currency: 'ARS',
      timezone: 'America/Argentina/Buenos_Aires',
      status: 'active',
      claimed: demo.claimed !== false,
      openOverride: null,
      customDomain: null,
      socialLinks: null,
      updatedAt: new Date(),
    };

    const result = existing
      ? await restaurants.findOneAndUpdate(
          filter,
          { $set: restaurantDoc },
          { returnDocument: 'after' },
        )
      : await restaurants.insertOne({
          ...restaurantDoc,
          createdAt: new Date(),
        });

    const restaurantId = existing
      ? existing._id
      : ((result as unknown as { insertedId: unknown })
          .insertedId as mongoose.Types.ObjectId);

    // Menú fresco: recreo categorías e ítems.
    await categories.deleteMany({ restaurantId });
    await items.deleteMany({ restaurantId });

    for (const [ci, section] of demo.sections.entries()) {
      const cat = await categories.insertOne({
        restaurantId,
        name: section.name,
        description: section.description,
        displayOrder: ci,
        isVisible: true,
      });
      for (const [ii, item] of section.items.entries()) {
        await items.insertOne({
          restaurantId,
          categoryId: cat.insertedId,
          name: item.name,
          description: item.description,
          basePrice: item.basePrice,
          imageUrl: '',
          displayOrder: ii,
          isAvailable: true,
          isVisible: true,
          itemType: 'simple',
        });
      }
    }

    // Horarios: 7 días por local.
    await hours.deleteMany({ restaurantId });
    await hours.insertMany(
      demo.opener.map((h) => ({
        restaurantId,
        dayOfWeek: h.dayOfWeek,
        opensAt: h.opensAt,
        closesAt: h.closesAt,
        isClosed: h.isClosed,
      })),
    );

    console.log(
      `Demo listo: ${demo.slug} (${String(restaurantId)}) con ${demo.sections.length} categorías`,
    );
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
