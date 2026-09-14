import { countrySlugFrom, slugifyCity } from './slugify.js';

/**
 * Mapa citySlug -> geo para derivar la región (provincia/departamento/estado)
 * desde la ciudad ya cargada. Solo referencia datos conocidos; NO inventa:
 * una ciudad que no está en el mapa no se le adivina la región.
 * Argentina primero (102k hab. de Entre Ríos y agregados que vayamos
 * cargando); después crece por país.
 */
const CITY_GEO: Record<string, { countrySlug: string; region: string }> = {
  'concepcion-del-uruguay': { countrySlug: 'argentina', region: 'Entre Ríos' },
  parana: { countrySlug: 'argentina', region: 'Entre Ríos' },
  concordia: { countrySlug: 'argentina', region: 'Entre Ríos' },
  gualeguaychu: { countrySlug: 'argentina', region: 'Entre Ríos' },
  colon: { countrySlug: 'argentina', region: 'Entre Ríos' },
  federacion: { countrySlug: 'argentina', region: 'Entre Ríos' },
  villaguay: { countrySlug: 'argentina', region: 'Entre Ríos' },
  'la-paz': { countrySlug: 'argentina', region: 'Entre Ríos' },
  victoria: { countrySlug: 'argentina', region: 'Entre Ríos' },
  crespo: { countrySlug: 'argentina', region: 'Entre Ríos' },
  chajari: { countrySlug: 'argentina', region: 'Entre Ríos' },
  nogoya: { countrySlug: 'argentina', region: 'Entre Ríos' },
  gualeguay: { countrySlug: 'argentina', region: 'Entre Ríos' },
  paysandu: { countrySlug: 'uruguay', region: 'Paysandú' },
  zipaquira: { countrySlug: 'colombia', region: 'Cundinamarca' },
};

export interface DerivedGeo {
  countrySlug: string;
  region: string;
  regionSlug: string;
}

/**
 * Join keys geo del directorio de 3 niveles (/en/{pais}/{region}/{ciudad}).
 * - countrySlug siempre resolvible (con country o fallback al nickname).
 * - region vacía si la ciudad no está en el mapa: la página de ciudad no se
 *   generará hasta que se clasifique (mismo criterio "no inventar datos").
 */
export function deriveGeoFromCity(city: string, country?: string): DerivedGeo {
  const citySlug = slugifyCity(city);
  if (!citySlug) return { countrySlug: '', region: '', regionSlug: '' };
  const geo = CITY_GEO[citySlug];
  const countrySlug = geo?.countrySlug ?? countrySlugFrom(country ?? '');
  const region = geo?.region ?? '';
  return { countrySlug, region, regionSlug: slugifyCity(region) };
}
