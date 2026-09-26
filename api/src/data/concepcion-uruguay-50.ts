import {
  CONCEPCION_URUGUAY_20,
  type ConcepcionLocalImport,
} from './concepcion-uruguay-20.js';

const OFFICIAL_RESTAURANTS =
  'https://concepcionentrerios.tur.ar/index.php/gastronomia/restaurantes';
const OFFICIAL_PUBS =
  'https://concepcionentrerios.tur.ar/index.php/gastronomia/pubs';
const LOCAL_GUIDE =
  'https://concepciondeluruguay.site/turismo-concepcion-del-uruguay';

const directoryOnly = (
  category: string,
  name: string,
  address: string,
  phone: string,
  sourceUrls: string[] = [OFFICIAL_RESTAURANTS],
): ConcepcionLocalImport => ({
  slug: name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, ''),
  name,
  description: `${category === 'bar' ? 'Bar' : 'Local gastronómico'} listado en fuentes públicas locales.`,
  address,
  phone,
  category,
  claimed: false,
  coordinates: null,
  socialLinks: null,
  sections: [],
  sourceUrls,
  menuSourceUrl: null,
  sourceStatus: 'needs_geocode',
  notes:
    'Lead público para validación comercial: confirmar que sigue activo, horarios y canales antes de una importación productiva.',
  digitalPresence: {
    evidence: sourceUrls,
    delivery: 'unknown',
    reservations: 'unknown',
    publicHours: false,
    salesPriority: 'medium',
  },
});

const additions: ConcepcionLocalImport[] = [
  {
    ...directoryOnly(
      'otro',
      'Buffet Club Rocamora',
      'Club Rocamora, Concepción del Uruguay',
      '+54 3442 451455',
    ),
    sourceUrls: [
      'https://es.restaurantguru.com/Buffet-Club-Rocamora-Concepcion-del-Uruguay',
    ],
  },
  {
    ...directoryOnly(
      'otro',
      'Justo José',
      'RN 14 km 129, Termas Concepción, Concepción del Uruguay',
      '+54 9 3442 566016',
      [OFFICIAL_RESTAURANTS, 'https://termasconcepcion.com/restaurant.html'],
    ),
    digitalPresence: {
      websiteUrl: 'https://termasconcepcion.com/restaurant.html',
      instagramUrl: 'https://www.instagram.com/justojosetermas/',
      whatsapp: '+54 9 3442 566016',
      delivery: 'no',
      reservations: 'yes',
      publicHours: true,
      evidence: [
        OFFICIAL_RESTAURANTS,
        'https://termasconcepcion.com/restaurant.html',
        'https://es.restaurantguru.com/Justo-Jose-Resto-Bar-Concepcion-del-Uruguay',
      ],
      salesPriority: 'high',
    },
  },
  {
    ...directoryOnly(
      'bar',
      'Eros Resto Bar',
      'Galarza 451, Concepción del Uruguay',
      '',
      ['https://queresto.com/erosrestobar'],
    ),
    menuSourceUrl: 'https://queresto.com/erosrestobar',
    digitalPresence: {
      menuUrl: 'https://queresto.com/erosrestobar',
      orderingUrl: 'https://queresto.com/erosrestobar',
      delivery: 'yes',
      reservations: 'unknown',
      publicHours: false,
      evidence: ['https://queresto.com/erosrestobar'],
      salesPriority: 'high',
    },
  },
  {
    ...directoryOnly(
      'pizzeria',
      'Cibo Ricco',
      'Delivery y retiro en Concepción del Uruguay',
      '+54 9 3442 500075',
      ['https://ciboricco.netlify.app/'],
    ),
    digitalPresence: {
      websiteUrl: 'https://ciboricco.netlify.app/',
      orderingUrl: 'https://wa.me/5493442500075',
      instagramUrl: 'https://www.instagram.com/cibo.ricco.pizzeria/',
      whatsapp: '+54 9 3442 500075',
      delivery: 'yes',
      reservations: 'no',
      publicHours: true,
      evidence: ['https://ciboricco.netlify.app/'],
      salesPriority: 'high',
    },
  },
  {
    ...directoryOnly(
      'bar',
      'Ana No Duerme',
      'Posadas 599, Concepción del Uruguay',
      '+54 9 3442 668398',
      [OFFICIAL_PUBS, 'https://danielfigueroa23.github.io/ana-no-duerme/'],
    ),
    digitalPresence: {
      websiteUrl: 'https://danielfigueroa23.github.io/ana-no-duerme/',
      instagramUrl: 'https://www.instagram.com/_ana.no.duerme_/',
      whatsapp: '+54 9 3442 668398',
      delivery: 'unknown',
      reservations: 'unknown',
      publicHours: false,
      evidence: [
        OFFICIAL_PUBS,
        'https://danielfigueroa23.github.io/ana-no-duerme/',
      ],
      salesPriority: 'high',
    },
  },
  {
    ...directoryOnly(
      'bar',
      'Barraca Club',
      'Blvd. Dr. R. Uncal 519, Concepción del Uruguay',
      '+54 9 3442 473558',
      [
        OFFICIAL_PUBS,
        'https://lanochedelasbirrerias.com.ar/cerveceria/barraca-club-2/',
      ],
    ),
    digitalPresence: {
      instagramUrl: 'https://www.instagram.com/barraca.club/',
      whatsapp: '+54 9 3442 473558',
      delivery: 'unknown',
      reservations: 'unknown',
      publicHours: true,
      evidence: [
        OFFICIAL_PUBS,
        'https://lanochedelasbirrerias.com.ar/cerveceria/barraca-club-2/',
      ],
      salesPriority: 'medium',
    },
  },
  {
    ...directoryOnly(
      'bar',
      'Grow Brewery',
      'Galarza 799, Concepción del Uruguay',
      '+54 9 3442 621742',
      [
        OFFICIAL_PUBS,
        'https://carta.menu/restaurants/concepcion-del-uruguay/grow-ferneteria-cerveceria-braseria',
      ],
    ),
    menuSourceUrl:
      'https://carta.menu/restaurants/concepcion-del-uruguay/grow-ferneteria-cerveceria-braseria',
    digitalPresence: {
      menuUrl:
        'https://carta.menu/restaurants/concepcion-del-uruguay/grow-ferneteria-cerveceria-braseria',
      instagramUrl: 'https://www.instagram.com/growcdelu/',
      whatsapp: '+54 9 3442 621742',
      delivery: 'unknown',
      reservations: 'unknown',
      publicHours: true,
      evidence: [
        OFFICIAL_PUBS,
        'https://carta.menu/restaurants/concepcion-del-uruguay/grow-ferneteria-cerveceria-braseria',
      ],
      salesPriority: 'high',
    },
  },
  {
    ...directoryOnly(
      'bar',
      'La Salamanca',
      'Av. Esilda Tavella, Concepción del Uruguay',
      '+54 9 3442 485082',
      [
        OFFICIAL_PUBS,
        'https://es.restaurantguru.com/La-Salamanca-Bar-Botanico-Concepcion-del-Uruguay',
      ],
    ),
    digitalPresence: {
      instagramUrl: 'https://www.instagram.com/salamancabarbotanico/',
      publicHours: true,
      delivery: 'no',
      reservations: 'no',
      evidence: [
        OFFICIAL_PUBS,
        'https://es.restaurantguru.com/La-Salamanca-Bar-Botanico-Concepcion-del-Uruguay',
      ],
      salesPriority: 'medium',
    },
  },
  {
    ...directoryOnly(
      'bar',
      'La Taberna',
      'Rocamora 410, Concepción del Uruguay',
      '+54 9 3442 626200',
      [
        OFFICIAL_PUBS,
        'https://es.restaurantguru.com/La-Taberna-Pizza-Bar-Concepcion-del-Uruguay-Concepcion-del-Uruguay',
      ],
    ),
    digitalPresence: {
      delivery: 'yes',
      reservations: 'unknown',
      publicHours: true,
      evidence: [
        OFFICIAL_PUBS,
        'https://es.restaurantguru.com/La-Taberna-Pizza-Bar-Concepcion-del-Uruguay-Concepcion-del-Uruguay',
      ],
      salesPriority: 'high',
    },
  },
  {
    ...directoryOnly(
      'bar',
      'Mondo Fonk',
      'Juan Perón 132, Concepción del Uruguay',
      '+54 9 3442 645508',
      [OFFICIAL_PUBS],
    ),
    socialLinks: { instagram: 'https://www.instagram.com/mondo.fonk/' },
    digitalPresence: {
      instagramUrl: 'https://www.instagram.com/mondo.fonk/',
      whatsapp: '+54 9 3442 645508',
      delivery: 'unknown',
      reservations: 'unknown',
      publicHours: false,
      evidence: [OFFICIAL_PUBS],
      salesPriority: 'medium',
    },
  },
  {
    ...directoryOnly(
      'bar',
      'Sinatra',
      '9 de Julio 349, Concepción del Uruguay',
      '+54 9 3442 645508',
      [OFFICIAL_PUBS],
    ),
    socialLinks: { instagram: 'https://www.instagram.com/bar_sinatra/' },
    digitalPresence: {
      instagramUrl: 'https://www.instagram.com/bar_sinatra/',
      whatsapp: '+54 9 3442 645508',
      delivery: 'unknown',
      reservations: 'unknown',
      publicHours: false,
      evidence: [OFFICIAL_PUBS],
      salesPriority: 'medium',
    },
  },
  directoryOnly(
    'pizzeria',
    'Casa Nostra',
    'Eva Perón 200, Concepción del Uruguay',
    '+54 9 3442 425737',
    [LOCAL_GUIDE],
  ),
  directoryOnly(
    'pizzeria',
    'La Peatonal',
    'Rocamora y Urquiza, Concepción del Uruguay',
    '+54 9 3442 422040',
    [LOCAL_GUIDE],
  ),
  directoryOnly(
    'pizzeria',
    'La Ris',
    'Galarza y Urquiza, Concepción del Uruguay',
    '+54 9 3442 437846',
    [LOCAL_GUIDE],
  ),
  directoryOnly(
    'pizzeria',
    'Guay-Ari',
    'Concepción del Uruguay',
    '+54 9 3442 428363',
    [LOCAL_GUIDE],
  ),
  directoryOnly(
    'bar',
    'Drakkar Brewpub',
    'Artusi 755, Concepción del Uruguay',
    '+54 9 3442 15507936',
    [LOCAL_GUIDE],
  ),
  directoryOnly(
    'bar',
    'Waresney Bar',
    '8 de Junio 505, Concepción del Uruguay',
    '+54 9 3442 15503601',
    [LOCAL_GUIDE],
  ),
  directoryOnly(
    'bar',
    'La Buena Vida Lounge Bar',
    'Juan Perón y Alejo Peyret, Concepción del Uruguay',
    '+54 9 3442 15627208',
    [LOCAL_GUIDE],
  ),
  directoryOnly(
    'bar',
    'Bartolo Bar',
    '3 de Febrero y San Martín, Concepción del Uruguay',
    '+54 9 3442 427162',
    [LOCAL_GUIDE],
  ),
  directoryOnly(
    'bar',
    'La Esquina del Infinito',
    '9 de Julio 1598, Concepción del Uruguay',
    '+54 9 3442 439429',
    [LOCAL_GUIDE],
  ),
  directoryOnly(
    'otro',
    'La Costera',
    'Bv. Hipólito Yrigoyen 150, Concepción del Uruguay',
    '+54 9 3442 430542',
    [LOCAL_GUIDE],
  ),
  directoryOnly(
    'otro',
    'Lo de Pipi',
    'Eva Perón y Peatonal, Concepción del Uruguay',
    '+54 9 3442 431633',
    [LOCAL_GUIDE],
  ),
  directoryOnly(
    'otro',
    'Parribar',
    'Balneario Banco Pelay, Concepción del Uruguay',
    '+54 9 3442 448109',
    [LOCAL_GUIDE],
  ),
  directoryOnly(
    'otro',
    'Parrilla La Gruta',
    'Zona centro, Concepción del Uruguay',
    '',
    [LOCAL_GUIDE],
  ),
  directoryOnly(
    'cafe',
    'Confitería San Carlos',
    '9 de Julio 1549, Concepción del Uruguay',
    '+54 9 3442 429050',
    [LOCAL_GUIDE],
  ),
  directoryOnly(
    'cafe',
    'Dulce Tentación',
    'Ruiz Moreno 1079, Concepción del Uruguay',
    '+54 9 3442 610690',
    [LOCAL_GUIDE],
  ),
  directoryOnly(
    'otro',
    'Vinoteca Satto',
    '25 de Mayo 136, Concepción del Uruguay',
    '+54 9 3442 427661',
    [LOCAL_GUIDE],
  ),
  directoryOnly(
    'panaderia',
    'Panadería Central',
    'Rocamora y Mitre, Concepción del Uruguay',
    '+54 9 3442 422525',
    [LOCAL_GUIDE],
  ),
  directoryOnly('otro', 'El Museo Restó', 'Concepción del Uruguay', '', [
    'https://es.restaurantguru.com/Concepcion-del-Uruguay/3',
  ]),
  directoryOnly('bar', 'Bajo Llave 929', 'Concepción del Uruguay', '', [
    'https://es.restaurantguru.com/Concepcion-del-Uruguay/3',
  ]),
  directoryOnly('otro', 'Mamma Mia', 'Concepción del Uruguay', '', [
    'https://es.restaurantguru.com/Concepcion-del-Uruguay/3',
  ]),
  directoryOnly('pizzeria', 'Pizza&Love', 'Concepción del Uruguay', '', [
    'https://es.restaurantguru.com/Concepcion-del-Uruguay/3',
  ]),
  directoryOnly(
    'bar',
    'Big Lola Resto',
    'Alberdi 1151, Concepción del Uruguay',
    '',
    [
      'https://lacarte.menu/restaurants/concepcion-del-uruguay/big-lola-resto/l/localisation-carte',
    ],
  ),
  directoryOnly('bar', 'NISO Restobar', 'Concepción del Uruguay', '', [
    'https://es.restaurantguru.com/Concepcion-del-Uruguay/3',
  ]),
];

const existingEnriched = CONCEPCION_URUGUAY_20.map((local) =>
  local.slug === 'garifo-resto-bar'
    ? {
        ...local,
        digitalPresence: {
          websiteUrl: 'https://gariforestobar.wixsite.com/garifo',
          instagramUrl: local.socialLinks?.instagram ?? null,
          whatsapp: local.phone,
          delivery: 'yes' as const,
          reservations: 'unknown' as const,
          publicHours: true,
          evidence: ['https://gariforestobar.wixsite.com/garifo'],
          salesPriority: 'high' as const,
        },
      }
    : local,
);

export const CONCEPCION_URUGUAY_50: ConcepcionLocalImport[] = [
  ...existingEnriched,
  ...additions.slice(0, 30),
];
