import 'dotenv/config';
import mongoose from 'mongoose';

/**
 * Seed de DEMO (datos mockeados): dos locales completos de Concepción del
 * Uruguay para mostrar el producto punta a punta en el directorio:
 *  - hamburgueseria-el-ojin (claimed=true, con carta y horarios)
 *  - pizzeria-la-barca (claimed=true, con carta y horarios)
 *  - heladeria-manhattan y rotiseria-dona-clara (claimed=false, ficha con menú solo lectura)
 * PATCHES completa el perfil de locales de prueba existentes sin tocar su menú.
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
  /** Coordenadas del local: sin ellas NearbyStores no puede ordenar por distancia. */
  coordinates: { lat: number; lng: number };
  /** Galería demo (hotlinks Unsplash validados 200 image/* al escribirlos). */
  gallery: { url: string; source: 'external'; alt: string }[];
  banner: string;
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
    coordinates: { lat: -32.4829, lng: -58.2361 },
    banner:
      'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=1600&q=80',
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=1200&q=80',
        source: 'external',
        alt: 'Cucurucho de helado artesanal',
      },
      {
        url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80',
        source: 'external',
        alt: 'Salón atendiéndo comenzales',
      },
      {
        url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
        source: 'external',
        alt: 'Interior del local',
      },
    ],
    opener: [
      { dayOfWeek: 0, opensAt: '11:00', closesAt: '23:30', isClosed: false },
      { dayOfWeek: 1, opensAt: '11:00', closesAt: '23:30', isClosed: false },
      { dayOfWeek: 2, opensAt: '11:00', closesAt: '23:30', isClosed: false },
      { dayOfWeek: 3, opensAt: '11:00', closesAt: '23:30', isClosed: false },
      { dayOfWeek: 4, opensAt: '11:00', closesAt: '00:30', isClosed: false },
      { dayOfWeek: 5, opensAt: '11:00', closesAt: '00:30', isClosed: false },
      { dayOfWeek: 6, opensAt: '11:00', closesAt: '00:30', isClosed: false },
    ],
    sections: [
      {
        name: 'Helado por kilo',
        description: 'Hasta 4 gustos por pote',
        items: [
          {
            name: '1 kg',
            description: 'Hasta 4 gustos',
            basePrice: 14500,
          },
          {
            name: '1/2 kg',
            description: 'Hasta 3 gustos',
            basePrice: 8200,
          },
          {
            name: '1/4 kg',
            description: 'Hasta 2 gustos',
            basePrice: 4700,
          },
        ],
      },
      {
        name: 'Cucuruchos y vasitos',
        description: '',
        items: [
          {
            name: 'Cucurucho simple',
            description: '1 bocha, cono de galleta',
            basePrice: 2600,
          },
          {
            name: 'Cucurucho doble',
            description: '2 bochas con baño de chocolate',
            basePrice: 3900,
          },
          {
            name: 'Vasito',
            description: '2 gustos',
            basePrice: 3100,
          },
        ],
      },
      {
        name: 'Postres helados',
        description: '',
        items: [
          {
            name: 'Almendrado',
            description: 'Porción de almendrado con salsa de chocolate',
            basePrice: 4300,
          },
          {
            name: 'Bombón escocés',
            description: 'Crema americana y chocolate, cubierto en chocolate',
            basePrice: 2200,
          },
          {
            name: 'Palito bombón',
            description: 'Dulce de leche cubierto en chocolate',
            basePrice: 1500,
          },
        ],
      },
    ],
  },
  {
    slug: 'rotiseria-dona-clara',
    name: 'Rotisería Doña Clara',
    description:
      'Comida casera para llevar: pollo al spiedo, milanesas, tartas y guarniciones. Menú del día de lunes a sábado.',
    address: 'Estrada 612, Concepción del Uruguay',
    phone: '+54 9 3442 559418',
    category: 'rotiseria',
    claimed: false,
    coordinates: { lat: -32.4872, lng: -58.2391 },
    banner:
      'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=1600&q=80',
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=1200&q=80',
        source: 'external',
        alt: 'Pollo grillado con limón y verduras',
      },
      {
        url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=1200&q=80',
        source: 'external',
        alt: 'Guiso de pollo con verduras',
      },
      {
        url: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=1200&q=80',
        source: 'external',
        alt: 'Mesa con platos para compartir',
      },
    ],
    opener: [
      { dayOfWeek: 0, opensAt: '11:00', closesAt: '14:30', isClosed: false },
      { dayOfWeek: 1, opensAt: '11:00', closesAt: '21:30', isClosed: false },
      { dayOfWeek: 2, opensAt: '11:00', closesAt: '21:30', isClosed: false },
      { dayOfWeek: 3, opensAt: '11:00', closesAt: '21:30', isClosed: false },
      { dayOfWeek: 4, opensAt: '11:00', closesAt: '21:30', isClosed: false },
      { dayOfWeek: 5, opensAt: '11:00', closesAt: '22:00', isClosed: false },
      { dayOfWeek: 6, opensAt: '11:00', closesAt: '22:00', isClosed: false },
    ],
    sections: [
      {
        name: 'Pollo',
        description: 'Al spiedo, sale desde las 11',
        items: [
          {
            name: 'Pollo al spiedo entero',
            description: 'Con chimichurri de la casa',
            basePrice: 13500,
          },
          {
            name: 'Medio pollo',
            description: 'Con chimichurri de la casa',
            basePrice: 7200,
          },
        ],
      },
      {
        name: 'Minutas',
        description: '',
        items: [
          {
            name: 'Milanesa de carne',
            description: 'Nalga rebozada, frita o al horno',
            basePrice: 6800,
          },
          {
            name: 'Milanesa napolitana',
            description: 'Jamón, muzzarella y salsa de tomate',
            basePrice: 8400,
          },
          {
            name: 'Tarta de jamón y queso',
            description: 'Porción grande',
            basePrice: 4200,
          },
          {
            name: 'Tarta de verdura',
            description: 'Acelga, cebolla y huevo',
            basePrice: 3900,
          },
        ],
      },
      {
        name: 'Guarniciones',
        description: '',
        items: [
          {
            name: 'Papas fritas',
            description: 'Porción para 2',
            basePrice: 4500,
          },
          {
            name: 'Ensalada rusa',
            description: 'Papa, zanahoria, arvejas y mayonesa casera',
            basePrice: 3600,
          },
          {
            name: 'Puré de papas',
            description: '',
            basePrice: 3200,
          },
        ],
      },
    ],
  },
  {
    slug: 'hamburgueseria-el-ojin',
    name: 'Hamburguesería El Ojin',
    description:
      'Medallones caseros a la parrilla, pan de brioche horneado en el local y papas rústicas. La doble cheddar es la favorita de la noche.',
    address: 'General Urquiza 1243, Concepción del Uruguay',
    phone: '+54 9 3442 551204',
    category: 'hamburgueseria',
    coordinates: { lat: -32.4861, lng: -58.2339 },
    banner:
      'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=1600&q=80',
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=1200&q=80',
        source: 'external',
        alt: 'Hamburguesa doble con papas',
      },
      {
        url: 'https://images.unsplash.com/photo-1547584370-2cc98b8b8dc8?auto=format&fit=crop&w=1200&q=80',
        source: 'external',
        alt: 'Hamburguesa con cheddar fundido',
      },
      {
        url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
        source: 'external',
        alt: 'Interior del local',
      },
    ],
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
    coordinates: { lat: -32.4789, lng: -58.2297 },
    banner:
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1600&q=80',
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80',
        source: 'external',
        alt: 'Pizza muzzarella recién salida del horno',
      },
      {
        url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80',
        source: 'external',
        alt: 'Pizza especial con rodajas de tomate',
      },
      {
        url: 'https://images.unsplash.com/photo-1595854341625-f33ee10dbf94?auto=format&fit=crop&w=1200&q=80',
        source: 'external',
        alt: 'Pizza albahaca sobre la mesa de trabajo',
      },
    ],
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

interface ProfilePatch {
  slug: string;
  set: Record<string, unknown>;
  opener?: DemoLocalSeed['opener'];
}

const PATCHES: ProfilePatch[] = [
  {
    slug: 'leonardos',
    set: {
      category: 'pizzeria',
      description:
        'Pizzas grandes a la piedra con base de tomate o de cebolla, empanadas y calentitos. Pedidos para llevar y delivery.',
      coordinates: { lat: -32.4808, lng: -58.2413 },
      bannerUrl:
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1600&q=80',
      photoGallery: [
        {
          url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80',
          source: 'external',
          alt: 'Pizza con rodajas de tomate',
        },
        {
          url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80',
          source: 'external',
          alt: 'Pizza muzzarella recién salida del horno',
        },
      ],
    },
    opener: [
      { dayOfWeek: 0, opensAt: '19:30', closesAt: '23:59', isClosed: false },
      { dayOfWeek: 1, opensAt: '', closesAt: '', isClosed: true },
      { dayOfWeek: 2, opensAt: '19:30', closesAt: '23:30', isClosed: false },
      { dayOfWeek: 3, opensAt: '19:30', closesAt: '23:30', isClosed: false },
      { dayOfWeek: 4, opensAt: '19:30', closesAt: '23:30', isClosed: false },
      { dayOfWeek: 5, opensAt: '19:30', closesAt: '01:00', isClosed: false },
      { dayOfWeek: 6, opensAt: '19:30', closesAt: '01:00', isClosed: false },
    ],
  },
  {
    slug: 'la-famosa',
    set: {
      description:
        'Hamburguesas, pizza dogs y pizzas para compartir. Combos para la noche y bebidas frías.',
      coordinates: { lat: -32.3206, lng: -58.0795 },
      bannerUrl:
        'https://images.unsplash.com/photo-1547584370-2cc98b8b8dc8?auto=format&fit=crop&w=1600&q=80',
      photoGallery: [
        {
          url: 'https://images.unsplash.com/photo-1547584370-2cc98b8b8dc8?auto=format&fit=crop&w=1200&q=80',
          source: 'external',
          alt: 'Hamburguesa con cheddar fundido',
        },
        {
          url: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=1200&q=80',
          source: 'external',
          alt: 'Hamburguesa doble con papas',
        },
      ],
    },
    opener: [
      { dayOfWeek: 0, opensAt: '19:00', closesAt: '23:59', isClosed: false },
      { dayOfWeek: 1, opensAt: '19:00', closesAt: '23:59', isClosed: false },
      { dayOfWeek: 2, opensAt: '19:00', closesAt: '23:59', isClosed: false },
      { dayOfWeek: 3, opensAt: '19:00', closesAt: '23:59', isClosed: false },
      { dayOfWeek: 4, opensAt: '19:00', closesAt: '23:59', isClosed: false },
      { dayOfWeek: 5, opensAt: '19:00', closesAt: '02:00', isClosed: false },
      { dayOfWeek: 6, opensAt: '19:00', closesAt: '02:00', isClosed: false },
    ],
  },
  {
    slug: 'pizza-libre',
    set: {
      category: 'pizzeria',
      description:
        'Pizzas artesanales, hamburguesas y pizza dogs. Pedí para llevar o a domicilio.',
      coordinates: { lat: 5.0226, lng: -74.0057 },
      photoGallery: [
        {
          url: 'https://images.unsplash.com/photo-1595854341625-f33ee10dbf94?auto=format&fit=crop&w=1200&q=80',
          source: 'external',
          alt: 'Pizza albahaca sobre la mesa de trabajo',
        },
        {
          url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80',
          source: 'external',
          alt: 'Pizza muzzarella recién salida del horno',
        },
      ],
    },
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
      coordinates: demo.coordinates,
      phone: demo.phone,
      bannerUrl: demo.banner,
      photoGallery: demo.gallery,
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

  for (const patch of PATCHES) {
    const existing = await restaurants.findOne({ slug: patch.slug });
    if (!existing) {
      console.log(`Patch omitido: ${patch.slug} no existe`);
      continue;
    }
    await restaurants.updateOne(
      { _id: existing._id },
      { $set: { ...patch.set, updatedAt: new Date() } },
    );
    const hasHours =
      (await hours.countDocuments({ restaurantId: existing._id })) > 0;
    const addHours = Boolean(patch.opener) && !hasHours;
    if (addHours && patch.opener) {
      await hours.insertMany(
        patch.opener.map((h) => ({
          restaurantId: existing._id,
          dayOfWeek: h.dayOfWeek,
          opensAt: h.opensAt,
          closesAt: h.closesAt,
          isClosed: h.isClosed,
        })),
      );
    }
    console.log(
      `Perfil completado: ${patch.slug}${addHours ? ' + horarios' : ''}`,
    );
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
