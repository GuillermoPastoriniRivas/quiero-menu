/**
 * Inventario del directorio gastronómico de Concepción del Uruguay.
 *
 * Fuente: directorio oficial de turismo (concepcionentrerios.tur.ar), relevado
 * por rubro el 2026-10-17. Incluye los 50 registros previos (enriquecidos con
 * dirección, teléfono, coordenadas y redes cuando la fuente los publica) más los
 * locales faltantes. No incluye imágenes.
 *
 * Los números que la fuente repite en tres o más fichas se consideran contacto
 * genérico y se descartan. Datos sólo para completar huecos: el importador nunca
 * reemplaza valores ya cargados ni toca menús u horarios.
 */
export interface DirectoryInventoryRow {
  slug: string;
  name: string;
  city: string;
  country: 'AR' | 'UY' | 'CO';
  region?: string;
  category: string;
  address?: string;
  phone?: string;
  coordinates?: { lat: number; lng: number };
  socialLinks?: { instagram?: string; facebook?: string; tiktok?: string };
  sourceUrls: string[];
}

export const CONCEPCION_DIRECTORY: DirectoryInventoryRow[] = [
  {
    slug: 'baco-fusion',
    name: 'Baco Fusión',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'otro',
    address: 'Rocamora 129, Concepción del Uruguay',
    phone: '+54 9 3442 549695',
    coordinates: {
      lat: -32.4814002,
      lng: -58.2227631,
    },
    socialLinks: {
      instagram: 'https://www.instagram.com/bacofusion/',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/restaurantes',
      'https://carta.menu/restaurants/concepcion-del-uruguay/baco-fusion',
    ],
  },
  {
    slug: 'bella-vista',
    name: 'Bella Vista',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'cafe',
    address: '3 de Febrero 5, Concepción del Uruguay',
    phone: '03442 432788',
    coordinates: {
      lat: -32.4905206,
      lng: -58.2318797,
    },
    socialLinks: {
      facebook:
        'https://www.facebook.com/Bella-vista-caferesto-104340481250205',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/restaurantes',
      'https://bellavista.ola.click/products',
    ],
  },
  {
    slug: 'bonhomia',
    name: 'Bonhomia',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'pizzeria',
    address: 'Mitre 61, Concepción del Uruguay',
    phone: '+54 9 3442 561662',
    coordinates: {
      lat: -32.4791115,
      lng: -58.2221718,
    },
    socialLinks: {
      instagram: 'https://www.instagram.com/bonhomiarestobarcdlu/',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/restaurantes',
    ],
  },
  {
    slug: 'danubio-azul',
    name: 'Danubio Azul',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'otro',
    address: 'San Martín 763, Concepción del Uruguay',
    phone: '+54 9 3442 423244',
    coordinates: {
      lat: -32.4856304,
      lng: -58.2330251,
    },
    socialLinks: {
      instagram: 'https://www.instagram.com/danubiocdelu/',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/restaurantes',
      'https://www.tripadvisor.co/Restaurant_Review-g1601791-d7591662-Reviews-Danubio_Azul-Concepcion_del_Uruguay_Province_of_Entre_Rios_Litoral.html',
    ],
  },
  {
    slug: 'dolores-costa',
    name: 'Dolores Costa',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'otro',
    address: 'Galarza y República del Líbano, Concepción del Uruguay',
    phone: '+54 9 3442 506970',
    socialLinks: {
      instagram: 'https://www.instagram.com/dolorescostarestobar/',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/restaurantes',
      'https://es.restaurantguru.com/Dolores-Costa-Concepcion-del-Uruguay',
      'https://www.lapiramide.net/noticias/2026/06/08/345833-dolores-costa-invita-a-descubrir-su-renovado-espacio-gastronomico-en-concepcion-del-uruguay',
    ],
  },
  {
    slug: 'el-faro-3260',
    name: 'El Faro 3260',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'bar',
    address: 'Jordana y Defensa Sur, Concepción del Uruguay',
    phone: '+54 9 3442 525150',
    socialLinks: {
      instagram: 'https://www.instagram.com/faro.3260/',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/restaurantes',
    ],
  },
  {
    slug: 'el-portenito',
    name: 'El Porteñito',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'otro',
    address: 'Perú 281, Concepción del Uruguay',
    phone: '+54 3442 425799',
    coordinates: {
      lat: -32.4794074,
      lng: -58.2263506,
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/restaurantes',
    ],
  },
  {
    slug: 'garifo-resto-bar',
    name: 'Garifo Resto Bar',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'bar',
    address: 'España 193, Concepción del Uruguay',
    phone: '+54 9 3442 416427',
    coordinates: {
      lat: -32.4917319,
      lng: -58.2325081,
    },
    socialLinks: {
      instagram: 'https://www.instagram.com/gariforestobar/',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/restaurantes',
      'https://gariforestobar.wixsite.com/garifo',
    ],
  },
  {
    slug: 'hamburgo-hamburgueseria',
    name: 'Hamburgo Hamburguesería',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'hamburgueseria',
    address: '25 de Mayo 157, Concepción del Uruguay',
    phone: '+54 9 3442 517570',
    coordinates: {
      lat: -32.482315,
      lng: -58.2326167,
    },
    socialLinks: {
      instagram: 'https://www.instagram.com/hamburgo.ok/',
    },
    sourceUrls: [
      'https://es.restaurantguru.com/Hamburgo-Gourmet-Concepcion-del-Uruguay',
      'https://todoresto.com/restaurantes/entre-rios/concepcion-del-uruguay/hamburgo-hamburgueseria/',
    ],
  },
  {
    slug: 'la-casa-del-chef',
    name: 'La Casa del Chef',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'otro',
    address: 'Mitre 246, Concepción del Uruguay',
    phone: '+54 9 3442 544938',
    coordinates: {
      lat: -32.4795725,
      lng: -58.2251877,
    },
    socialLinks: {
      instagram: 'https://www.instagram.com/la.casadelchef/',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/restaurantes',
    ],
  },
  {
    slug: 'la-delfina',
    name: 'La Delfina',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'otro',
    address: 'Eva Perón 125, Concepción del Uruguay',
    phone: '+54 9 3442 429468',
    coordinates: {
      lat: -32.4826504,
      lng: -58.2317344,
    },
    socialLinks: {
      instagram: 'https://www.instagram.com/restaurantladelfina/',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/restaurantes?start=10',
    ],
  },
  {
    slug: 'la-morada',
    name: 'La Morada',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'otro',
    address: 'Henry 809, Concepción del Uruguay',
    phone: '+54 9 3442 611149',
    coordinates: {
      lat: -32.4890324,
      lng: -58.2321495,
    },
    socialLinks: {
      instagram: 'https://www.instagram.com/lamoradacdu/',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/restaurantes?start=10',
    ],
  },
  {
    slug: 'la-terraza-de-nuestros-viejos',
    name: 'La Terraza de Nuestros Viejos',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'otro',
    address: 'Bv. Hipólito Yrigoyen 14, Concepción del Uruguay',
    phone: '+54 9 3442 544679',
    coordinates: {
      lat: -32.4781839,
      lng: -58.2387043,
    },
    socialLinks: {
      instagram: 'https://www.instagram.com/laterrazadenuestrosviejos/',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/restaurantes?start=10',
      'https://concepciondeluruguay.site/turismo-concepcion-del-uruguay',
    ],
  },
  {
    slug: 'martin-restaurante',
    name: 'Martín Restaurante',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'rotiseria',
    address: 'Galarza 780, Concepción del Uruguay',
    phone: '+54 9 3442 524146',
    coordinates: {
      lat: -32.4848556,
      lng: -58.2377541,
    },
    socialLinks: {
      instagram: 'https://www.instagram.com/lhrestaurante_martinn/',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/restaurantes?start=10',
    ],
  },
  {
    slug: 'paradise',
    name: 'Paradise',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'pizzeria',
    address: 'J. J. Bruno 2538, Concepción del Uruguay',
    phone: '+54 3442 300130',
    socialLinks: {
      instagram: 'https://www.instagram.com/paradisecdelu/',
    },
    sourceUrls: ['https://tiendas.pedix.app/comercio/paradise/'],
  },
  {
    slug: 'panza-verde',
    name: 'Panza Verde Pizza Bar',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'pizzeria',
    address: 'Parador Norte Isla del Puerto, Concepción del Uruguay',
    phone: '+54 9 3442 643752',
    coordinates: {
      lat: -32.4787606,
      lng: -58.2153451,
    },
    socialLinks: {
      instagram: 'https://www.instagram.com/panzaverdepizzabar/',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/restaurantes?start=10',
    ],
  },
  {
    slug: 'pimienta-negra',
    name: 'Pimienta Negra',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'otro',
    address: '9 de Julio 1124, Concepción del Uruguay',
    phone: '+54 9 3442 667093',
    coordinates: {
      lat: -32.4858238,
      lng: -58.2393376,
    },
    socialLinks: {
      instagram: 'https://www.instagram.com/pimienta.resto/',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/restaurantes?start=10',
    ],
  },
  {
    slug: 'pizzeria-don-quijote',
    name: 'Pizzería Don Quijote',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'pizzeria',
    address: 'Ereño 673, Concepción del Uruguay',
    phone: '+54 9 3442 433999',
    coordinates: {
      lat: -32.4881741,
      lng: -58.2309505,
    },
    socialLinks: {
      instagram: 'https://www.instagram.com/quijote.pizzabar/',
    },
    sourceUrls: [
      'https://es.restaurantguru.com/Don-Quijote-Concepcion-del-Uruguay-2',
    ],
  },
  {
    slug: 'pizzeria-pizzas',
    name: "Pizzería Pizza's",
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'pizzeria',
    address: 'Bv. Hipólito Yrigoyen 796-798, Concepción del Uruguay',
    phone: '+54 9 3442 519885',
    coordinates: {
      lat: -32.4801594,
      lng: -58.2378833,
    },
    socialLinks: {
      instagram: 'https://www.instagram.com/lapizzeria.427585/',
      facebook: 'https://www.facebook.com/lapizzeriaestradaycongresodetucuman/',
    },
    sourceUrls: [
      'https://es.restaurantguru.com/Pizzeria-Pizzas-Concepcion-del-Uruguay',
    ],
  },
  {
    slug: 'sahara-resto-bar',
    name: 'Sahara Resto Bar',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'bar',
    address: 'Galarza 1613, Concepción del Uruguay',
    phone: '+54 9 3442 470015',
    coordinates: {
      lat: -32.4867463,
      lng: -58.2483571,
    },
    socialLinks: {
      instagram: 'https://www.instagram.com/sahararestobar/',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/restaurantes?start=10',
    ],
  },
  {
    slug: 'buffet-club-rocamora',
    name: 'Buffet Club Rocamora',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'otro',
    address: 'Club Rocamora, Concepción del Uruguay',
    phone: '+54 3442 451455',
    sourceUrls: [
      'https://es.restaurantguru.com/Buffet-Club-Rocamora-Concepcion-del-Uruguay',
    ],
  },
  {
    slug: 'justo-jose',
    name: 'Justo José',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'otro',
    address: 'RN 14 km 129, Termas Concepción, Concepción del Uruguay',
    phone: '+54 9 3442 566016',
    socialLinks: {
      instagram:
        'https://www.instagram.com/justojoserestobar/https://www.instagram.com/justojoserestobar/',
      facebook: 'https://www.facebook.com/gariforesto/',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/restaurantes',
      'https://termasconcepcion.com/restaurant.html',
    ],
  },
  {
    slug: 'eros-resto-bar',
    name: 'Eros Resto Bar',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'bar',
    address: 'Galarza 451, Concepción del Uruguay',
    phone: '+54 3442 407460',
    sourceUrls: ['https://queresto.com/erosrestobar'],
  },
  {
    slug: 'cibo-ricco',
    name: 'Cibo Ricco',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'pizzeria',
    address: 'Delivery y retiro en Concepción del Uruguay',
    phone: '+54 9 3442 500075',
    sourceUrls: ['https://ciboricco.netlify.app/'],
  },
  {
    slug: 'ana-no-duerme',
    name: 'Ana No Duerme',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'bar',
    address: 'Posadas 599, Concepción del Uruguay',
    phone: '+54 9 3442 668398',
    coordinates: {
      lat: -32.4814489,
      lng: -58.2331866,
    },
    socialLinks: {
      instagram: 'https://www.instagram.com/_ana.no.duerme_/',
      facebook:
        'https://www.facebook.com/Ana-no-Duerme-Resto-Bar-111057223766735',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/pubs',
      'https://danielfigueroa23.github.io/ana-no-duerme/',
    ],
  },
  {
    slug: 'barraca-club',
    name: 'Barraca Club',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'bar',
    address: 'Blvd. Dr. R. Uncal 519, Concepción del Uruguay',
    phone: '+54 9 3442 473558',
    socialLinks: {
      instagram: 'https://www.instagram.com/barraca.club/',
      facebook: 'https://www.facebook.com/barracaclub',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/pubs',
      'https://lanochedelasbirrerias.com.ar/cerveceria/barraca-club-2/',
    ],
  },
  {
    slug: 'grow-brewery',
    name: 'Grow Brewery',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'bar',
    address: 'Galarza 799, Concepción del Uruguay',
    phone: '+54 9 3442 621742',
    socialLinks: {
      instagram: 'https://www.instagram.com/growcdelu/',
      facebook: 'https://www.facebook.com/GrowFerneteriaCerveceriaBraseria',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/pubs',
      'https://carta.menu/restaurants/concepcion-del-uruguay/grow-ferneteria-cerveceria-braseria',
    ],
  },
  {
    slug: 'la-salamanca',
    name: 'La Salamanca',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'bar',
    address: 'Av. Esilda Tavella, Concepción del Uruguay',
    phone: '+54 9 3442 485082',
    coordinates: {
      lat: -32.4690264,
      lng: -58.232453,
    },
    socialLinks: {
      instagram: 'https://www.instagram.com/salamancabarbotanico/',
      facebook: 'https://www.facebook.com/LaSalamancabarbotanico',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/pubs',
      'https://es.restaurantguru.com/La-Salamanca-Bar-Botanico-Concepcion-del-Uruguay',
    ],
  },
  {
    slug: 'la-taberna',
    name: 'La Taberna',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'bar',
    address: 'Rocamora 410, Concepción del Uruguay',
    phone: '+54 9 3442 626200',
    coordinates: {
      lat: -32.4821499,
      lng: -58.2298624,
    },
    socialLinks: {
      instagram: 'https://www.instagram.com/barlataberna/',
      facebook: 'https://www.facebook.com/latabernacdelu',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/pubs',
      'https://es.restaurantguru.com/La-Taberna-Pizza-Bar-Concepcion-del-Uruguay-Concepcion-del-Uruguay',
    ],
  },
  {
    slug: 'mondo-fonk',
    name: 'Mondo Fonk',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'bar',
    address: 'Juan Perón 132, Concepción del Uruguay',
    phone: '+54 9 3442 645508',
    socialLinks: {
      instagram: 'https://www.instagram.com/mondo.fonk/',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/pubs',
    ],
  },
  {
    slug: 'sinatra',
    name: 'Sinatra',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'bar',
    address: '9 de Julio 349, Concepción del Uruguay',
    phone: '+54 9 3442 645508',
    coordinates: {
      lat: -32.4862164,
      lng: -58.2329985,
    },
    socialLinks: {
      instagram: 'https://www.instagram.com/bar_sinatra/',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/pubs',
    ],
  },
  {
    slug: 'casa-nostra',
    name: 'Casa Nostra',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'pizzeria',
    address: 'Eva Perón 200, Concepción del Uruguay',
    phone: '+54 9 3442 425737',
    sourceUrls: [
      'https://concepciondeluruguay.site/turismo-concepcion-del-uruguay',
    ],
  },
  {
    slug: 'la-peatonal',
    name: 'La Peatonal',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'pizzeria',
    address: 'Rocamora y Urquiza, Concepción del Uruguay',
    phone: '+54 9 3442 422040',
    coordinates: {
      lat: -32.4833461,
      lng: -58.2354252,
    },
    socialLinks: {
      facebook:
        'https://www.facebook.com/pages/Pizzer%C3%ADa%20La%20Peatonal%20Consepcion%20Del%20Uruguay/1196916827044672/',
    },
    sourceUrls: [
      'https://concepciondeluruguay.site/turismo-concepcion-del-uruguay',
    ],
  },
  {
    slug: 'la-ris',
    name: 'La Ris',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'pizzeria',
    address: 'Galarza y Urquiza, Concepción del Uruguay',
    phone: '+54 9 3442 437846',
    coordinates: {
      lat: -32.4839361,
      lng: -58.2351774,
    },
    sourceUrls: [
      'https://concepciondeluruguay.site/turismo-concepcion-del-uruguay',
    ],
  },
  {
    slug: 'guay-ari',
    name: 'Guay-Ari',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'pizzeria',
    address: 'Concepción del Uruguay',
    phone: '+54 9 3442 428363',
    coordinates: {
      lat: -32.4870596,
      lng: -58.236318,
    },
    sourceUrls: [
      'https://concepciondeluruguay.site/turismo-concepcion-del-uruguay',
    ],
  },
  {
    slug: 'drakkar-brewpub',
    name: 'Drakkar Brewpub',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'bar',
    address: 'Artusi 755, Concepción del Uruguay',
    phone: '+54 9 3442 15507936',
    coordinates: {
      lat: -32.4805705,
      lng: -58.2361143,
    },
    socialLinks: {
      facebook:
        'https://www.facebook.com/Drakkar-Brewpub-Cerveza-Artesanal-1828414117451571',
    },
    sourceUrls: [
      'https://concepciondeluruguay.site/turismo-concepcion-del-uruguay',
    ],
  },
  {
    slug: 'waresney-bar',
    name: 'Waresney Bar',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'bar',
    address: '8 de Junio 505, Concepción del Uruguay',
    phone: '+54 9 3442 15503601',
    sourceUrls: [
      'https://concepciondeluruguay.site/turismo-concepcion-del-uruguay',
    ],
  },
  {
    slug: 'la-buena-vida-lounge-bar',
    name: 'La Buena Vida Lounge Bar',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'bar',
    address: 'Juan Perón y Alejo Peyret, Concepción del Uruguay',
    phone: '+54 9 3442 15627208',
    sourceUrls: [
      'https://concepciondeluruguay.site/turismo-concepcion-del-uruguay',
    ],
  },
  {
    slug: 'bartolo-bar',
    name: 'Bartolo Bar',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'bar',
    address: '3 de Febrero y San Martín, Concepción del Uruguay',
    phone: '+54 9 3442 427162',
    socialLinks: {
      facebook: 'https://www.facebook.com/BartoloBarCdelU',
    },
    sourceUrls: [
      'https://concepciondeluruguay.site/turismo-concepcion-del-uruguay',
    ],
  },
  {
    slug: 'la-esquina-del-infinito',
    name: 'La Esquina del Infinito',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'bar',
    address: '9 de Julio 1598, Concepción del Uruguay',
    phone: '+54 9 3442 439429',
    sourceUrls: [
      'https://concepciondeluruguay.site/turismo-concepcion-del-uruguay',
    ],
  },
  {
    slug: 'la-costera',
    name: 'La Costera',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'otro',
    address: 'Bv. Hipólito Yrigoyen 150, Concepción del Uruguay',
    phone: '+54 9 3442 430542',
    sourceUrls: [
      'https://concepciondeluruguay.site/turismo-concepcion-del-uruguay',
    ],
  },
  {
    slug: 'lo-de-pipi',
    name: 'Lo de Pipi',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'otro',
    address: 'Eva Perón y Peatonal, Concepción del Uruguay',
    phone: '+54 9 3442 431633',
    sourceUrls: [
      'https://concepciondeluruguay.site/turismo-concepcion-del-uruguay',
    ],
  },
  {
    slug: 'parribar',
    name: 'Parribar',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'otro',
    address: 'Balneario Banco Pelay, Concepción del Uruguay',
    phone: '+54 9 3442 448109',
    sourceUrls: [
      'https://concepciondeluruguay.site/turismo-concepcion-del-uruguay',
    ],
  },
  {
    slug: 'parrilla-la-gruta',
    name: 'Parrilla La Gruta',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'otro',
    address: 'Zona centro, Concepción del Uruguay',
    phone: '+549344220955',
    coordinates: {
      lat: -32.4771449,
      lng: -58.3068098,
    },
    socialLinks: {
      instagram: 'https://www.instagram.com/parrillalagruta/',
      facebook: 'https://www.facebook.com/lagrutaparrilla',
    },
    sourceUrls: [
      'https://concepciondeluruguay.site/turismo-concepcion-del-uruguay',
    ],
  },
  {
    slug: 'confiteria-san-carlos',
    name: 'Confitería San Carlos',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'cafe',
    address: '9 de Julio 1549, Concepción del Uruguay',
    phone: '+54 9 3442 429050',
    sourceUrls: [
      'https://concepciondeluruguay.site/turismo-concepcion-del-uruguay',
    ],
  },
  {
    slug: 'dulce-tentacion',
    name: 'Dulce Tentación',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'cafe',
    address: 'Ruiz Moreno 1079, Concepción del Uruguay',
    phone: '+54 9 3442 610690',
    sourceUrls: [
      'https://concepciondeluruguay.site/turismo-concepcion-del-uruguay',
    ],
  },
  {
    slug: 'vinoteca-satto',
    name: 'Vinoteca Satto',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'otro',
    address: '25 de Mayo 136, Concepción del Uruguay',
    phone: '+54 9 3442 427661',
    sourceUrls: [
      'https://concepciondeluruguay.site/turismo-concepcion-del-uruguay',
    ],
  },
  {
    slug: 'panaderia-central',
    name: 'Panadería Central',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'panaderia',
    address: 'Rocamora y Mitre, Concepción del Uruguay',
    phone: '+54 9 3442 422525',
    sourceUrls: [
      'https://concepciondeluruguay.site/turismo-concepcion-del-uruguay',
    ],
  },
  {
    slug: 'el-museo-resto',
    name: 'El Museo Restó',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'otro',
    address: 'Concepción del Uruguay',
    phone: '+54 3442 43-0659',
    sourceUrls: ['https://es.restaurantguru.com/Concepcion-del-Uruguay/3'],
  },
  {
    slug: 'bajo-llave-929',
    name: 'Bajo Llave 929',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'bar',
    address: 'Concepción del Uruguay',
    phone: '+54 9 3442 581 234',
    socialLinks: {
      instagram: 'https://www.instagram.com/bajollave929/',
    },
    sourceUrls: ['https://es.restaurantguru.com/Concepcion-del-Uruguay/3'],
  },
  {
    slug: 'don-quiquiche',
    name: 'Don Quiquiche',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'parrilla',
    address: 'Ruta 39',
    phone: '+5493442581870',
    coordinates: {
      lat: -32.4868478,
      lng: -58.3012976,
    },
    socialLinks: {
      instagram: 'https://www.instagram.com/parrilla.donquiquiche/',
      facebook:
        'https://www.facebook.com/Parrilla-Don-Quiquiche-336944663704963/',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/parrillas/118-don-quiquiche',
    ],
  },
  {
    slug: 'el-monumento',
    name: 'El Monumento',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'parrilla',
    address: 'Dr. Isaac Stilman 44',
    phone: '+5493442405391',
    coordinates: {
      lat: -32.4893475,
      lng: -58.261036,
    },
    socialLinks: {
      instagram: 'https://www.instagram.com/parrillamonumento/',
      facebook:
        'https://www.facebook.com/pages/Parrilla%20El%20Monumento/1819406558177374/',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/parrillas/119-el-monumento',
    ],
  },
  {
    slug: 'la-segunda',
    name: 'La Segunda',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'parrilla',
    address: 'Dr. Isaac Stilman 44',
    phone: '+5493442441076',
    coordinates: {
      lat: -32.4887459,
      lng: -58.2614851,
    },
    socialLinks: {
      instagram: 'https://www.instagram.com/parrilla.la.segunda/',
      facebook: 'https://www.facebook.com/lagrutaparrilla',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/parrillas/121-la-segunda',
    ],
  },
  {
    slug: 'locos-de-asar',
    name: 'Locos de Asar',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'parrilla',
    address: 'Suipacha y Güemes',
    phone: '+5493442581588',
    coordinates: {
      lat: -32.4924371,
      lng: -58.246273,
    },
    socialLinks: {
      instagram: 'https://www.instagram.com/locosdeasarr/',
      facebook: 'https://www.facebook.com/Locos-de-asar-412400849358620',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/parrillas/160-locos-asar',
    ],
  },
  {
    slug: 'chelin-restaurante-de-campo',
    name: 'Chelin Restaurante de Campo',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'parrilla',
    address: 'RP 42',
    phone: '+5493442624419',
    coordinates: {
      lat: -32.5297158,
      lng: -58.3055563,
    },
    socialLinks: {
      facebook: 'https://www.facebook.com/ChelinRestaurante',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/parrillas/233-chelin',
    ],
  },
  {
    slug: 'don-enrique',
    name: 'Don Enrique',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'parrilla',
    address: 'Clementina Comte de Alió y 9 de Julio',
    phone: '+5493442624419',
    coordinates: {
      lat: -32.4893815,
      lng: -58.2706368,
    },
    socialLinks: {
      facebook: 'https://www.facebook.com/Parrilla-DON-Enrique-302705143679077',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/parrillas/234-don-enrique',
    ],
  },
  {
    slug: 'big-lola',
    name: 'Big Lola',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'pizzeria',
    address: 'Eva Perón 99',
    phone: '+5493442403499',
    coordinates: {
      lat: -32.4830952,
      lng: -58.2336866,
    },
    socialLinks: {
      instagram: 'https://www.instagram.com/big_lola_resto_bar/',
      facebook: 'https://www.facebook.com/biglola.pizzabar',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/pizzerias/122-big-lola',
    ],
  },
  {
    slug: 'papa-luiggi',
    name: 'Papa Luiggi',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'pizzeria',
    address: '21 de Noviembre 38',
    phone: '+5493442520015',
    coordinates: {
      lat: -32.485717,
      lng: -58.2375673,
    },
    socialLinks: {
      instagram: 'https://www.instagram.com/pizzapapaluigi/',
      facebook: 'https://www.facebook.com/Pizza-Papa-Luigi-104368051206911',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/pizzerias/128-papa-luiggi',
    ],
  },
  {
    slug: 'pizza-love',
    name: 'Pizza & Love',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'pizzeria',
    address: 'Antartida Argentina 296',
    phone: '+5493442433624',
    coordinates: {
      lat: -32.4789951,
      lng: -58.2276363,
    },
    socialLinks: {
      instagram: 'https://www.instagram.com/pizzalove_by_maxi_bonus/',
      facebook: 'https://www.facebook.com/Pizzalovedebonus',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/pizzerias/129-pizza-love',
    ],
  },
  {
    slug: 'vero-sabores',
    name: 'Vero Sabores',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'pizzeria',
    address: 'Galarza 1598',
    phone: '+5493442454545',
    coordinates: {
      lat: -32.4865836,
      lng: -58.2502377,
    },
    socialLinks: {
      instagram: 'https://www.instagram.com/_verosabores/',
      facebook: 'https://www.facebook.com/verosaborespizza',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/pizzerias/131-vero-sabores',
    ],
  },
  {
    slug: 'buona-pizza',
    name: 'Buona Pizza',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'pizzeria',
    address: 'Güemes 89',
    phone: '+5493442625597',
    coordinates: {
      lat: -32.4882588,
      lng: -58.2473092,
    },
    socialLinks: {
      instagram: 'https://www.instagram.com/buonapizzacdelu/',
      facebook: 'https://www.facebook.com/buona.pi.73',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/pizzerias/132-buona-pizza',
    ],
  },
  {
    slug: 'cocobongo',
    name: 'Cocobongo',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'pizzeria',
    address: 'Bv. Constituyentes 645',
    phone: '+5493442570841',
    coordinates: {
      lat: -32.4769084,
      lng: -58.2467929,
    },
    socialLinks: {
      instagram: 'https://www.instagram.com/bar_sinatra/',
      facebook: 'https://www.facebook.com/Cocobongorestobar',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/pizzerias/146-cocobongo',
    ],
  },
  {
    slug: 'la-nuit',
    name: 'La Nuit',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'pizzeria',
    address: 'Juan Perón 130',
    phone: '+54 3442 653714',
    coordinates: {
      lat: -32.4862671,
      lng: -58.2330687,
    },
    socialLinks: {
      instagram: 'https://www.instagram.com/pizzerialanuit/',
      facebook: 'https://www.facebook.com/Pizzerialanuit',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/pizzerias/179-la-nuit',
    ],
  },
  {
    slug: 'mamma-mia',
    name: 'Mamma Mia',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'pizzeria',
    address: 'España 160',
    phone: '+5493442571967',
    coordinates: {
      lat: -32.487235,
      lng: -58.2354865,
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/pizzerias/190-mamma-mia',
    ],
  },
  {
    slug: 'pizza-por-metro',
    name: 'Pizza por Metro',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'pizzeria',
    address: 'España y Sarmiento',
    phone: '+5493442640472',
    coordinates: {
      lat: -32.4871315,
      lng: -58.2356314,
    },
    socialLinks: {
      instagram: 'https://www.instagram.com/pizzeriapanaderia/',
      facebook:
        'https://www.facebook.com/groups/1546032425712046/user/100049004326362/',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/pizzerias/235-pizza-metro',
    ],
  },
  {
    slug: 'camec',
    name: 'Camec',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'pizzeria',
    phone: '+5493442527358',
    socialLinks: {
      instagram: 'https://www.instagram.com/camec__pizzeria/',
      facebook: 'https://www.facebook.com/Pizzeria-Camec-348043372522764',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/pizzerias/236-camec',
    ],
  },
  {
    slug: 'rock-pizza',
    name: 'Rock & Pizza',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'pizzeria',
    address: 'Tibiletti 359',
    phone: '+5493442502632',
    coordinates: {
      lat: -32.4894295,
      lng: -58.2308768,
    },
    socialLinks: {
      facebook: 'https://www.facebook.com/Rock-Pizza-Renovado-103789878002932',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/pizzerias/237-rock-pizza',
    ],
  },
  {
    slug: 'san-remo',
    name: 'San Remo',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'pizzeria',
    phone: '+5493442667572',
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/pizzerias/238-san-remo',
    ],
  },
  {
    slug: 'pizzeria-del-barrio',
    name: 'Pizzería del Barrio',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'pizzeria',
    phone: '+5493442416464',
    socialLinks: {
      facebook: 'https://www.facebook.com/pizzeriadelbarriocdu',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/pizzerias/239-del-barrio',
    ],
  },
  {
    slug: 'de-otro-planeta',
    name: 'De Otro Planeta',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'pizzeria',
    phone: '+54931124927568',
    socialLinks: {
      instagram: 'https://www.instagram.com/pizzas.deotroplaneta/',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/pizzerias/240-otro-planeta',
    ],
  },
  {
    slug: 'bwana-bar',
    name: 'Bwana Bar',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'bar',
    phone: '+5493442553197',
    socialLinks: {
      instagram: 'https://www.instagram.com/bwanabar.cdelu/',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/pubs/135-bwana',
    ],
  },
  {
    slug: 'la-cuadra-billar-pool',
    name: 'La Cuadra Billar Pool',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'bar',
    phone: '+5493442529038',
    socialLinks: {
      instagram: 'https://www.instagram.com/lacuadrabillar/',
      facebook: 'https://www.facebook.com/lacuadrabillar/',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/pubs/138-lacuadra-billar',
    ],
  },
  {
    slug: '7-colinas',
    name: '7 Colinas',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'cerveceria',
    address: 'Estrada 838',
    phone: '+5493442415124',
    coordinates: {
      lat: -32.4799457,
      lng: -58.2375203,
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/cervecerias/74-7-colinas-cdelu',
    ],
  },
  {
    slug: 'ambar',
    name: 'Ambar',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'cerveceria',
    address: '25 de Mayo 181',
    phone: '+5493442535419',
    coordinates: {
      lat: -32.4822425,
      lng: -58.2356867,
    },
    socialLinks: {
      facebook:
        'https://www.facebook.com/Cerveza-Artesanal-Ambar-1594981377465312',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/cervecerias/94-ambar',
    ],
  },
  {
    slug: 'bigua',
    name: 'Bigua',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'cerveceria',
    address: 'Juan Perón y San Martín',
    phone: '+549344230613676',
    coordinates: {
      lat: -32.485194,
      lng: -58.2333841,
    },
    socialLinks: {
      facebook:
        'https://www.facebook.com/Cerveza-Artesanal-Ambar-1594981377465312',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/cervecerias/95-bigua',
    ],
  },
  {
    slug: 'don-alejandro',
    name: 'Don Alejandro',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'cerveceria',
    address: '9 de Julio entre 21 y 22 del Oeste Sur',
    phone: '+5493442415755',
    coordinates: {
      lat: -32.488958,
      lng: -58.2654276,
    },
    socialLinks: {
      facebook: 'https://www.facebook.com/cervezaartesanaldonalejandro',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/cervecerias/96-don-alejandro',
    ],
  },
  {
    slug: 'klug-gebrau',
    name: 'Klug Gebrau',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'cerveceria',
    address: 'Cabo Labalta 440',
    phone: '+5493442456232',
    coordinates: {
      lat: -32.4822171,
      lng: -58.2572033,
    },
    socialLinks: {
      instagram: 'https://www.instagram.com/kluggebrau/',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/cervecerias/98-klug',
    ],
  },
  {
    slug: 'lagash',
    name: 'Lagash',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'cerveceria',
    address: 'Ruíz Moreno 657',
    phone: '+5492215916272',
    coordinates: {
      lat: -32.4773151,
      lng: -58.2504781,
    },
    socialLinks: {
      instagram: 'https://www.instagram.com/lagashbeerartesanal/',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/cervecerias/99-lagash',
    ],
  },
  {
    slug: 'tractor',
    name: 'Tractor',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'cerveceria',
    address: 'Artusi y Carosini',
    phone: '+5493442654652',
    coordinates: {
      lat: -32.4812326,
      lng: -58.2401659,
    },
    socialLinks: {
      instagram: 'https://www.instagram.com/cervezatractor/',
      facebook: 'https://www.facebook.com/cervezatractor',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/cervecerias/100-tractor',
    ],
  },
  {
    slug: '7-colinas-del-rio',
    name: '7 Colinas del Río',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'cerveceria',
    address: 'Parador Sur Costanera Isla del Puerto',
    phone: '+54 9 3442 662187',
    coordinates: {
      lat: -32.4871907,
      lng: -58.2170165,
    },
    socialLinks: {
      instagram: 'https://www.instagram.com/7colinasdelrio/',
      facebook:
        'https://www.facebook.com/7-Colinas-del-R%C3%ADo-2175651816021483',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/cervecerias/143-colinas-rio',
    ],
  },
  {
    slug: 'tres-perros',
    name: 'Tres Perros',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'cerveceria',
    address: '9 de Julio 976',
    phone: '+5492213034166',
    coordinates: {
      lat: -32.4855938,
      lng: -58.238996,
    },
    socialLinks: {
      facebook: 'https://www.facebook.com/Tres-Perros-100166421647316',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/cervecerias/216-tres-perros',
    ],
  },
  {
    slug: 'ruta-39',
    name: 'Ruta 39',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'cerveceria',
    address: 'Clementina Alió S/N - Entre J. J Bruno y J.C González',
    phone: '+5493442622625',
    coordinates: {
      lat: -32.4883833,
      lng: -58.2706261,
    },
    socialLinks: {
      facebook: 'https://www.facebook.com/cervezaruta39',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/cervecerias/219-ruta-39',
    ],
  },
  {
    slug: 'la-alemana',
    name: 'La Alemana',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'cerveceria',
    address: 'Malvinas Argentinas 213',
    phone: '+5493442518251',
    coordinates: {
      lat: -32.4887914,
      lng: -58.2396875,
    },
    socialLinks: {
      facebook:
        'https://www.facebook.com/La-Alemana-cerveza-artesanal-105398894428786',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/cervecerias/221-la-alemana',
    ],
  },
  {
    slug: 'filippo-cafe-bistro',
    name: 'Filippo Café + Bistro',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'cafe',
    address: '25 de Mayo 147',
    phone: '+5493442522767',
    coordinates: {
      lat: -32.4825281,
      lng: -58.234753,
    },
    socialLinks: {
      facebook: 'https://www.facebook.com/filippocafebistro',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/confiterias/101-filippo',
    ],
  },
  {
    slug: 'flora-casa-de-te',
    name: 'Flora Casa de Té',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'cafe',
    address: 'Colonia Perfección Norte calle 12 de Octubre s/n',
    phone: '+5491150543932',
    coordinates: {
      lat: -32.4730961,
      lng: -58.2937867,
    },
    socialLinks: {
      facebook: 'https://www.facebook.com/floracasadete',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/confiterias/104-flora-te',
    ],
  },
  {
    slug: 'fabrica-de-alfajores-la-quinta-sabores-entrerrianos',
    name: 'Fábrica de Alfajores "La Quinta Sabores Entrerrianos"',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'cafe',
    address: 'Juan Perón 555',
    phone: '+5493442458500',
    coordinates: {
      lat: -32.4877009,
      lng: -58.2351964,
    },
    socialLinks: {
      facebook: 'https://www.facebook.com/laquintasabores/',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/confiterias/206-la-quinta',
    ],
  },
  {
    slug: 'junk-food',
    name: 'Junk Food',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'otro',
    address: 'Bv. Araoz y Suipacha',
    phone: '+5493442642180',
    coordinates: {
      lat: -32.4931159,
      lng: -58.2510013,
    },
    socialLinks: {
      facebook: 'https://www.facebook.com/Junk-food-108888294169149',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/fast-food/112-junk-food',
    ],
  },
  {
    slug: 'mc-matthaus',
    name: 'Mc Matthaus',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'otro',
    phone: '+5493442556229',
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/fast-food/113-mc-matthaus',
    ],
  },
  {
    slug: 'food-truck',
    name: 'Food Truck',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'otro',
    address: 'Dr. Baldoni',
    phone: '+5493442670670',
    coordinates: {
      lat: -32.4880222,
      lng: -58.2617349,
    },
    socialLinks: {
      instagram: 'https://www.instagram.com/foodtruckcdelu/',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/fast-food/114-food-truck',
    ],
  },
  {
    slug: 'hambur-road',
    name: 'Hambur Road',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'otro',
    address: '25 de Mayo 245',
    phone: '+5493442524221',
    coordinates: {
      lat: -32.4811235,
      lng: -58.2350718,
    },
    socialLinks: {
      instagram: 'https://www.instagram.com/hamburroad/',
      facebook: 'https://www.facebook.com/hamburroad-111116400621761',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/fast-food/115-hambuer-road',
    ],
  },
  {
    slug: 'mordisco-s',
    name: 'Mordisco´s',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'hamburgueseria',
    address: '8 de Junio y Carosini',
    phone: '+5493442628678',
    coordinates: {
      lat: -32.4833821,
      lng: -58.2397589,
    },
    socialLinks: {
      instagram: 'https://www.instagram.com/mordiscos.hamburguesas/',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/fast-food/116-mordiscos',
    ],
  },
  {
    slug: 'sanduba',
    name: 'Sanduba',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'otro',
    address: 'Galarza 735',
    phone: '+5493442406759',
    coordinates: {
      lat: -32.4838934,
      lng: -58.2350476,
    },
    socialLinks: {
      instagram: 'https://www.instagram.com/sandubacdelu/',
      facebook: 'https://www.facebook.com/sandubaargentina',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/fast-food/117-sanduba',
    ],
  },
  {
    slug: 'hamburguesa-en-ingles',
    name: 'Hamburguesa en Inglés',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'hamburgueseria',
    address: 'Galarza 1175',
    phone: '+5493442654514',
    coordinates: {
      lat: -32.4853666,
      lng: -58.2424552,
    },
    socialLinks: {
      instagram: 'https://www.instagram.com/hamburguesaeningles/',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/fast-food/230-ingles',
    ],
  },
  {
    slug: 'el-semaforo',
    name: 'El Semáforo',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'otro',
    address: 'Bv. Constituyentes y Bv. Yrigoyen',
    phone: '+5493442469036',
    coordinates: {
      lat: -32.4792585,
      lng: -58.24619,
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/fast-food/231-semaforo',
    ],
  },
  {
    slug: 'tbt-food-truck',
    name: 'TBT Food Truck',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'otro',
    address: 'Bv. Montoneras 81',
    coordinates: {
      lat: -32.4877346,
      lng: -58.2445643,
    },
    socialLinks: {
      instagram: 'https://www.instagram.com/tbtfoodtruckcdelu/',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/fast-food/232-tbt',
    ],
  },
  {
    slug: 'che-dona',
    name: 'Che Doña',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'rotiseria',
    phone: '+5493442443135',
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/rotiserias-y-comida-para-llevar/166-che-dona',
    ],
  },
  {
    slug: 'como-piace',
    name: 'Como Piace',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'rotiseria',
    phone: '+5493442438515',
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/rotiserias-y-comida-para-llevar/168-como-piace',
    ],
  },
  {
    slug: 'desde-mi-cocina',
    name: 'Desde mi Cocina',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'rotiseria',
    phone: '+5493442570495',
    socialLinks: {
      instagram: 'https://www.instagram.com/ayresceleste/',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/rotiserias-y-comida-para-llevar/169-desde-cocina',
    ],
  },
  {
    slug: 'el-anzuelo',
    name: 'El Anzuelo',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'rotiseria',
    phone: '+5493442429456',
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/rotiserias-y-comida-para-llevar/170-el-anzuelo',
    ],
  },
  {
    slug: 'el-canguro',
    name: 'El Canguro',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'rotiseria',
    phone: '+5493442 430144',
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/rotiserias-y-comida-para-llevar/172-el-canguro',
    ],
  },
  {
    slug: 'la-croqueta',
    name: 'La Croqueta',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'rotiseria',
    phone: '+5493442 48-6719',
    socialLinks: {
      instagram: 'https://www.instagram.com/rotiseria_lacroqueta/',
      facebook: 'https://www.facebook.com/RotiseriaLaCroqueta',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/rotiserias-y-comida-para-llevar/173-la-croqueta',
    ],
  },
  {
    slug: 'la-tia-cocina',
    name: 'La Tía Cocina',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'rotiseria',
    phone: '+5493442673973',
    socialLinks: {
      instagram: 'https://www.instagram.com/latiacocina/',
      facebook: 'https://www.facebook.com/yanivelzi/',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/rotiserias-y-comida-para-llevar/175-la-tiacocina',
    ],
  },
  {
    slug: 'lo-komia',
    name: 'Lo Komia',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'rotiseria',
    phone: '+5493442 61-3394',
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/rotiserias-y-comida-para-llevar/176-la-komia',
    ],
  },
  {
    slug: 'me-gusta',
    name: 'Me Gusta',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'rotiseria',
    phone: '+5493442 66-8666',
    socialLinks: {
      instagram: 'https://www.instagram.com/megustacdu/',
      facebook: 'https://www.facebook.com/megustacdu',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/rotiserias-y-comida-para-llevar/177-me-gusta',
    ],
  },
  {
    slug: 'tia-beba',
    name: 'Tía Beba',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'rotiseria',
    phone: '+5493442417087',
    socialLinks: {
      instagram: 'https://www.instagram.com/pizzeriatiabeba/',
      facebook: 'https://www.facebook.com/pizzeria-TIA-BEBA-176280122449994',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/rotiserias-y-comida-para-llevar/178-tia-beba',
    ],
  },
  {
    slug: 'a-toda-hora',
    name: 'A Toda Hora',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'otro',
    address: 'Galarza 1248',
    phone: '+5493442577752',
    coordinates: {
      lat: -32.4854879,
      lng: -58.2433658,
    },
    socialLinks: {
      facebook: 'https://www.facebook.com/kiosco.atodahora.3',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/fast-food-2/105-toda-hora',
    ],
  },
  {
    slug: 'kiosco-dalmata',
    name: 'Kiosco Dalmata',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'otro',
    address: 'San Marín 554',
    phone: '03442 42-7625',
    coordinates: {
      lat: -32.4848598,
      lng: -58.2317441,
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/fast-food-2/106-dalmata',
    ],
  },
  {
    slug: 'la-rotonda',
    name: 'La Rotonda',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'otro',
    phone: '+54 3442 405023',
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/fast-food-2/107-la-rotonda',
    ],
  },
  {
    slug: 'el-cabe',
    name: 'El Cabe',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'otro',
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/fast-food-2/108-cabe',
    ],
  },
  {
    slug: 'parador-plaza',
    name: 'Parador Plaza',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'otro',
    phone: '+54 3442 539339',
    socialLinks: {
      instagram: 'https://www.instagram.com/paradorplazacdelu/',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/fast-food-2/109-parador-plaza',
    ],
  },
  {
    slug: 'pucara',
    name: 'Pucara',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'otro',
    address: 'Galarza 699',
    coordinates: {
      lat: -32.4840097,
      lng: -58.2350084,
    },
    socialLinks: {
      instagram: 'https://www.instagram.com/kioscopucara/',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/fast-food-2/110-pucara',
    ],
  },
  {
    slug: 'tilcara-drugstore-bar',
    name: 'Tilcara Drugstore Bar',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'otro',
    address: 'Galarza 658',
    coordinates: {
      lat: -32.483729,
      lng: -58.2337933,
    },
    socialLinks: {
      facebook: 'https://www.facebook.com/tilcara.drugstore',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/fast-food-2/111-tilcara',
    ],
  },
  {
    slug: 'el-gordo-wis',
    name: 'El Gordo Wis',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'otro',
    address: 'Juan Perón 369',
    coordinates: {
      lat: -32.4898494,
      lng: -58.2325521,
    },
    socialLinks: {
      instagram: 'https://www.instagram.com/elgordowissss/',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/fast-food-2/227-gordo-wis',
    ],
  },
  {
    slug: 'kiosco-blu',
    name: 'Kiosco Blu',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'otro',
    address: 'Juan Perón 174',
    phone: '+5493442661105',
    coordinates: {
      lat: -32.4869271,
      lng: -58.2329064,
    },
    socialLinks: {
      facebook: 'https://www.facebook.com/kioscoBlU',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/fast-food-2/228-blu',
    ],
  },
  {
    slug: 'kiosco-panther',
    name: 'Kiosco Panther',
    city: 'Concepción del Uruguay',
    country: 'AR',
    region: 'Entre Ríos',
    category: 'otro',
    address: 'España 297',
    coordinates: {
      lat: -32.4891471,
      lng: -58.2352639,
    },
    socialLinks: {
      instagram: 'https://www.instagram.com/pantherkiosco/',
    },
    sourceUrls: [
      'https://concepcionentrerios.tur.ar/index.php/gastronomia/fast-food-2/229-panther',
    ],
  },
];
