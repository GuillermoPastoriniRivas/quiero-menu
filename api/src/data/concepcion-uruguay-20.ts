export interface MenuItemImport {
  name: string;
  description: string;
  basePrice: number;
}

export interface MenuSectionImport {
  name: string;
  description: string;
  items: MenuItemImport[];
}

export interface ConcepcionLocalImport {
  slug: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  category: string;
  claimed: false;
  coordinates: { lat: number; lng: number } | null;
  socialLinks: { instagram?: string; facebook?: string } | null;
  sections: MenuSectionImport[];
  sourceUrls: string[];
  menuSourceUrl: string | null;
  sourceStatus: 'verified_public' | 'needs_geocode';
  notes: string;
  digitalPresence?: {
    websiteUrl?: string | null;
    menuUrl?: string | null;
    orderingUrl?: string | null;
    instagramUrl?: string | null;
    facebookUrl?: string | null;
    whatsapp?: string | null;
    delivery?: 'yes' | 'no' | 'unknown';
    reservations?: 'yes' | 'no' | 'unknown';
    publicHours?: boolean;
    evidence: string[];
    salesPriority?: 'high' | 'medium' | 'low';
  };
}

const OFFICIAL_DIRECTORY =
  'https://concepcionentrerios.tur.ar/index.php/gastronomia/restaurantes';
const OFFICIAL_DIRECTORY_PAGE_2 =
  'https://concepcionentrerios.tur.ar/index.php/gastronomia/restaurantes?start=10';

/**
 * Inventario público de prueba. Los registros son deliberately unclaimed:
 * cargar una ficha no implica afirmar relación comercial con el local.
 *
 * Los menús sólo contienen productos y precios publicados en una carta
 * consultable. El resto de los locales queda con ficha sin carta hasta tener
 * una fuente directa y vigente.
 */
export const CONCEPCION_URUGUAY_20: ConcepcionLocalImport[] = [
  {
    slug: 'baco-fusion',
    name: 'Baco Fusión',
    description: 'Restaurante de cocina fusión y carnes.',
    address: 'Rocamora 129, Concepción del Uruguay',
    phone: '+54 9 3442 549695',
    category: 'otro',
    claimed: false,
    coordinates: { lat: -32.4814002, lng: -58.2227631 },
    socialLinks: { instagram: 'https://www.instagram.com/bacofusion/' },
    sections: [],
    sourceUrls: [
      OFFICIAL_DIRECTORY,
      'https://carta.menu/restaurants/concepcion-del-uruguay/baco-fusion',
    ],
    menuSourceUrl:
      'https://esa-cdn.carta.menu/storage/media/companies_menu_pdf/89011834/baco-fusion-concepcion-del-uruguay-carta.pdf',
    sourceStatus: 'verified_public',
    notes:
      'La carta pública identifica platos, pero no se importan precios sin una lectura confiable del menú vigente.',
  },
  {
    slug: 'bella-vista',
    name: 'Bella Vista',
    description: 'Cafetería y restaurante con desayunos, meriendas y comidas.',
    address: '3 de Febrero 5, Concepción del Uruguay',
    phone: '',
    category: 'cafe',
    claimed: false,
    coordinates: { lat: -32.4905206, lng: -58.2318797 },
    socialLinks: null,
    sections: [
      {
        name: 'Café y desayunos',
        description: '',
        items: [
          { name: 'Café chico o jarrito', description: '', basePrice: 650 },
          { name: 'Café con leche', description: '', basePrice: 700 },
          { name: 'Capuchino', description: '', basePrice: 900 },
          { name: 'Medialunas', description: '', basePrice: 250 },
          {
            name: 'Medialunas con jamón y queso',
            description: '',
            basePrice: 500,
          },
          {
            name: 'Tradicional',
            description: 'Café con leche o té con tres medialunas',
            basePrice: 1450,
          },
          {
            name: 'Porteño',
            description:
              'Café con leche o té con tostado triple de jamón y queso',
            basePrice: 2700,
          },
          {
            name: 'Entrerriano',
            description:
              'Café con leche o té con dos medialunas rellenas de jamón y queso',
            basePrice: 1700,
          },
        ],
      },
    ],
    sourceUrls: [OFFICIAL_DIRECTORY, 'https://bellavista.ola.click/products'],
    menuSourceUrl: 'https://bellavista.ola.click/products',
    sourceStatus: 'verified_public',
    notes:
      'Se importó sólo una muestra de productos visible en la carta pública.',
  },
  {
    slug: 'bonhomia',
    name: 'Bonhomia',
    description: 'Restobar con opciones de fast food, pizza y delivery.',
    address: 'Mitre 61, Concepción del Uruguay',
    phone: '+54 9 3442 561662',
    category: 'pizzeria',
    claimed: false,
    coordinates: { lat: -32.4791115, lng: -58.2221718 },
    socialLinks: {
      instagram: 'https://www.instagram.com/bonhomiarestobarcdlu/',
    },
    sections: [],
    sourceUrls: [OFFICIAL_DIRECTORY],
    menuSourceUrl: null,
    sourceStatus: 'verified_public',
    notes: 'Ficha pública verificada; carta pendiente de fuente directa.',
  },
  {
    slug: 'danubio-azul',
    name: 'Danubio Azul',
    description:
      'Restaurante de cocina argentina con opciones de pastas, carnes y pescados.',
    address: 'San Martín 763, Concepción del Uruguay',
    phone: '+54 9 3442 423244',
    category: 'otro',
    claimed: false,
    coordinates: { lat: -32.4856304, lng: -58.2330251 },
    socialLinks: { instagram: 'https://www.instagram.com/danubiocdelu/' },
    sections: [],
    sourceUrls: [
      OFFICIAL_DIRECTORY,
      'https://www.tripadvisor.co/Restaurant_Review-g1601791-d7591662-Reviews-Danubio_Azul-Concepcion_del_Uruguay_Province_of_Entre_Rios_Litoral.html',
    ],
    menuSourceUrl: null,
    sourceStatus: 'verified_public',
    notes:
      'Las fuentes coinciden en el local y el teléfono; el número de calle aparece como 763/765 según la fuente.',
  },
  {
    slug: 'dolores-costa',
    name: 'Dolores Costa',
    description:
      'Restaurante y restobar con pizzas, empanadas, carnes y hamburguesas.',
    address: 'Galarza y República del Líbano, Concepción del Uruguay',
    phone: '+54 9 3442 506970',
    category: 'otro',
    claimed: false,
    coordinates: null,
    socialLinks: {
      instagram: 'https://www.instagram.com/dolorescostarestobar/',
    },
    sections: [],
    sourceUrls: [
      OFFICIAL_DIRECTORY,
      'https://es.restaurantguru.com/Dolores-Costa-Concepcion-del-Uruguay',
      'https://www.lapiramide.net/noticias/2026/06/08/345833-dolores-costa-invita-a-descubrir-su-renovado-espacio-gastronomico-en-concepcion-del-uruguay',
    ],
    menuSourceUrl: null,
    sourceStatus: 'needs_geocode',
    notes:
      'La dirección es un cruce de calles y queda pendiente una coordenada confiable.',
  },
  {
    slug: 'el-faro-3260',
    name: 'El Faro 3260',
    description: 'Bar y restaurante en la zona de Jordana y Defensa Sur.',
    address: 'Jordana y Defensa Sur, Concepción del Uruguay',
    phone: '+54 9 3442 525150',
    category: 'bar',
    claimed: false,
    coordinates: null,
    socialLinks: { instagram: 'https://www.instagram.com/faro.3260/' },
    sections: [],
    sourceUrls: [OFFICIAL_DIRECTORY],
    menuSourceUrl: null,
    sourceStatus: 'needs_geocode',
    notes: 'Cruce de calles sin resultado cartográfico inequívoco.',
  },
  {
    slug: 'el-portenito',
    name: 'El Porteñito',
    description: 'Restaurante listado en el directorio gastronómico local.',
    address: 'Perú 281, Concepción del Uruguay',
    phone: '+54 3442 425799',
    category: 'otro',
    claimed: false,
    coordinates: { lat: -32.4794074, lng: -58.2263506 },
    socialLinks: null,
    sections: [],
    sourceUrls: [OFFICIAL_DIRECTORY],
    menuSourceUrl: null,
    sourceStatus: 'verified_public',
    notes: 'Ficha pública verificada; carta pendiente.',
  },
  {
    slug: 'garifo-resto-bar',
    name: 'Garifo Resto Bar',
    description:
      'Bar-restaurante con finger food, platos clásicos, cervezas y cócteles.',
    address: 'España 193, Concepción del Uruguay',
    phone: '+54 9 3442 416427',
    category: 'bar',
    claimed: false,
    coordinates: { lat: -32.4917319, lng: -58.2325081 },
    socialLinks: { instagram: 'https://www.instagram.com/gariforestobar/' },
    sections: [],
    sourceUrls: [
      OFFICIAL_DIRECTORY,
      'https://gariforestobar.wixsite.com/garifo',
    ],
    menuSourceUrl: null,
    sourceStatus: 'verified_public',
    notes: 'Horarios y contacto tomados del sitio propio.',
  },
  {
    slug: 'hamburgo-hamburgueseria',
    name: 'Hamburgo Hamburguesería',
    description: 'Hamburguesería y pizzería con delivery.',
    address: '25 de Mayo 157, Concepción del Uruguay',
    phone: '+54 9 3442 517570',
    category: 'hamburgueseria',
    claimed: false,
    coordinates: { lat: -32.482315, lng: -58.2326167 },
    socialLinks: { instagram: 'https://www.instagram.com/hamburgo.ok/' },
    sections: [],
    sourceUrls: [
      'https://es.restaurantguru.com/Hamburgo-Gourmet-Concepcion-del-Uruguay',
      'https://todoresto.com/restaurantes/entre-rios/concepcion-del-uruguay/hamburgo-hamburgueseria/',
    ],
    menuSourceUrl: null,
    sourceStatus: 'verified_public',
    notes: 'Dirección, teléfono y horario contrastados en dos directorios.',
  },
  {
    slug: 'la-casa-del-chef',
    name: 'La Casa del Chef',
    description: 'Restaurante listado en el directorio gastronómico local.',
    address: 'Mitre 246, Concepción del Uruguay',
    phone: '+54 9 3442 544938',
    category: 'otro',
    claimed: false,
    coordinates: { lat: -32.4795725, lng: -58.2251877 },
    socialLinks: { instagram: 'https://www.instagram.com/la.casadelchef/' },
    sections: [],
    sourceUrls: [OFFICIAL_DIRECTORY],
    menuSourceUrl: null,
    sourceStatus: 'verified_public',
    notes: 'Ficha pública verificada; carta pendiente.',
  },
  {
    slug: 'la-delfina',
    name: 'La Delfina',
    description: 'Restaurante listado en el directorio gastronómico local.',
    address: 'Eva Perón 125, Concepción del Uruguay',
    phone: '+54 9 3442 429468',
    category: 'otro',
    claimed: false,
    coordinates: { lat: -32.4826504, lng: -58.2317344 },
    socialLinks: {
      instagram: 'https://www.instagram.com/restaurantladelfina/',
    },
    sections: [],
    sourceUrls: [OFFICIAL_DIRECTORY_PAGE_2],
    menuSourceUrl: null,
    sourceStatus: 'verified_public',
    notes: 'Ficha pública verificada; carta pendiente.',
  },
  {
    slug: 'la-morada',
    name: 'La Morada',
    description: 'Parrilla y restaurante.',
    address: 'Henry 809, Concepción del Uruguay',
    phone: '+54 9 3442 611149',
    category: 'otro',
    claimed: false,
    coordinates: { lat: -32.4890324, lng: -58.2321495 },
    socialLinks: { instagram: 'https://www.instagram.com/lamoradacdu/' },
    sections: [],
    sourceUrls: [OFFICIAL_DIRECTORY_PAGE_2],
    menuSourceUrl: null,
    sourceStatus: 'verified_public',
    notes: 'Ficha pública verificada; carta pendiente.',
  },
  {
    slug: 'la-terraza-de-nuestros-viejos',
    name: 'La Terraza de Nuestros Viejos',
    description: 'Restaurante listado en el directorio gastronómico local.',
    address: 'Bv. Hipólito Yrigoyen 14, Concepción del Uruguay',
    phone: '+54 9 3442 544679',
    category: 'otro',
    claimed: false,
    coordinates: { lat: -32.4781839, lng: -58.2387043 },
    socialLinks: {
      instagram: 'https://www.instagram.com/laterrazadenuestrosviejos/',
    },
    sections: [],
    sourceUrls: [
      OFFICIAL_DIRECTORY_PAGE_2,
      'https://concepciondeluruguay.site/turismo-concepcion-del-uruguay',
    ],
    menuSourceUrl: null,
    sourceStatus: 'verified_public',
    notes:
      'La coordenada corresponde al tramo geocodificado del boulevard; pendiente ajustar al número exacto.',
  },
  {
    slug: 'martin-restaurante',
    name: 'Martín Restaurante',
    description: 'Restaurante y rotisería con comida para llevar.',
    address: 'Galarza 780, Concepción del Uruguay',
    phone: '+54 9 3442 524146',
    category: 'rotiseria',
    claimed: false,
    coordinates: { lat: -32.4848556, lng: -58.2377541 },
    socialLinks: {
      instagram: 'https://www.instagram.com/lhrestaurante_martinn/',
    },
    sections: [],
    sourceUrls: [OFFICIAL_DIRECTORY_PAGE_2],
    menuSourceUrl: null,
    sourceStatus: 'verified_public',
    notes: 'Ficha pública verificada; carta pendiente.',
  },
  {
    slug: 'paradise',
    name: 'Paradise',
    description: 'Pizzería y hamburguesería con delivery y retiro en local.',
    address: 'J. J. Bruno 2538, Concepción del Uruguay',
    phone: '',
    category: 'pizzeria',
    claimed: false,
    coordinates: null,
    socialLinks: null,
    sections: [
      {
        name: 'Pizzas',
        description: '',
        items: [
          { name: 'Muzzarella', description: '', basePrice: 11000 },
          {
            name: 'Mitad y mitad',
            description: 'Precio desde',
            basePrice: 6000,
          },
          { name: 'Napolitana', description: '', basePrice: 14000 },
          { name: 'Especial', description: '', basePrice: 15200 },
        ],
      },
      {
        name: 'Empanadas',
        description: '',
        items: [
          { name: 'Empanada de carne', description: '', basePrice: 2200 },
          {
            name: 'Empanada de jamón y queso',
            description: '',
            basePrice: 2000,
          },
        ],
      },
      {
        name: 'Milanesas',
        description: '',
        items: [
          { name: 'Simple', description: 'Milanesa', basePrice: 15000 },
          { name: 'Campesino', description: 'Milanesa', basePrice: 16500 },
        ],
      },
    ],
    sourceUrls: ['https://tiendas.pedix.app/comercio/paradise/'],
    menuSourceUrl: 'https://tiendas.pedix.app/comercio/paradise/',
    sourceStatus: 'needs_geocode',
    notes:
      'La carta y dirección son públicas; falta una coordenada cartográfica inequívoca.',
  },
  {
    slug: 'panza-verde',
    name: 'Panza Verde Pizza Bar',
    description:
      'Restaurante y pizza bar en el Parador Norte de Isla del Puerto.',
    address: 'Parador Norte Isla del Puerto, Concepción del Uruguay',
    phone: '+54 9 3442 643752',
    category: 'pizzeria',
    claimed: false,
    coordinates: null,
    socialLinks: { instagram: 'https://www.instagram.com/panzaverdepizzabar/' },
    sections: [],
    sourceUrls: [OFFICIAL_DIRECTORY_PAGE_2],
    menuSourceUrl: null,
    sourceStatus: 'needs_geocode',
    notes:
      'Ubicación dentro de la isla; falta una coordenada cartográfica confiable.',
  },
  {
    slug: 'pimienta-negra',
    name: 'Pimienta Negra',
    description: 'Restaurante listado en el directorio gastronómico local.',
    address: '9 de Julio 1124, Concepción del Uruguay',
    phone: '+54 9 3442 667093',
    category: 'otro',
    claimed: false,
    coordinates: { lat: -32.4858238, lng: -58.2393376 },
    socialLinks: { instagram: 'https://www.instagram.com/pimienta.resto/' },
    sections: [],
    sourceUrls: [OFFICIAL_DIRECTORY_PAGE_2],
    menuSourceUrl: null,
    sourceStatus: 'verified_public',
    notes: 'Ficha pública verificada; carta pendiente.',
  },
  {
    slug: 'pizzeria-don-quijote',
    name: 'Pizzería Don Quijote',
    description: 'Pizzería con delivery y retiro en local.',
    address: 'Ereño 673, Concepción del Uruguay',
    phone: '+54 9 3442 433999',
    category: 'pizzeria',
    claimed: false,
    coordinates: { lat: -32.4881741, lng: -58.2309505 },
    socialLinks: null,
    sections: [],
    sourceUrls: [
      'https://es.restaurantguru.com/Don-Quijote-Concepcion-del-Uruguay-2',
    ],
    menuSourceUrl: null,
    sourceStatus: 'verified_public',
    notes: 'Ficha pública verificada; carta pendiente de fuente directa.',
  },
  {
    slug: 'pizzeria-pizzas',
    name: "Pizzería Pizza's",
    description: 'Pizzería con empanadas, delivery y retiro en local.',
    address: 'Bv. Hipólito Yrigoyen 796-798, Concepción del Uruguay',
    phone: '+54 9 3442 519885',
    category: 'pizzeria',
    claimed: false,
    coordinates: null,
    socialLinks: null,
    sections: [],
    sourceUrls: [
      'https://es.restaurantguru.com/Pizzeria-Pizzas-Concepcion-del-Uruguay',
    ],
    menuSourceUrl: null,
    sourceStatus: 'needs_geocode',
    notes:
      'El directorio confirma dirección y teléfono; falta una coordenada exacta.',
  },
  {
    slug: 'sahara-resto-bar',
    name: 'Sahara Resto Bar',
    description: 'Restaurante y restobar.',
    address: 'Galarza 1613, Concepción del Uruguay',
    phone: '+54 9 3442 470015',
    category: 'bar',
    claimed: false,
    coordinates: { lat: -32.4867463, lng: -58.2483571 },
    socialLinks: { instagram: 'https://www.instagram.com/sahararestobar/' },
    sections: [],
    sourceUrls: [OFFICIAL_DIRECTORY_PAGE_2],
    menuSourceUrl: null,
    sourceStatus: 'verified_public',
    notes: 'Ficha pública verificada; carta pendiente.',
  },
];
