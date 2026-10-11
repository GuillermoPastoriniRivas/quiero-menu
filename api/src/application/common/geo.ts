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
  'rosario-del-tala': { countrySlug: 'argentina', region: 'Entre Ríos' },
  resistencia: { countrySlug: 'argentina', region: 'Chaco' },
  'florencio-varela': { countrySlug: 'argentina', region: 'Buenos Aires' },
  necochea: { countrySlug: 'argentina', region: 'Buenos Aires' },
  lincoln: { countrySlug: 'argentina', region: 'Buenos Aires' },
  'mar-del-plata': { countrySlug: 'argentina', region: 'Buenos Aires' },
  'la-plata': { countrySlug: 'argentina', region: 'Buenos Aires' },
  rosario: { countrySlug: 'argentina', region: 'Santa Fe' },
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
export function deriveGeoFromCity(
  city: string,
  country?: string,
  explicitRegion?: string,
): DerivedGeo {
  const citySlug = slugifyCity(city);
  if (!citySlug) return { countrySlug: '', region: '', regionSlug: '' };
  const requestedCountry = countrySlugFrom(country ?? '');
  const candidate = CITY_GEO[citySlug];
  const geo =
    candidate &&
    (!requestedCountry || candidate.countrySlug === requestedCountry)
      ? candidate
      : undefined;
  const countrySlug = requestedCountry || geo?.countrySlug || '';
  // Homonymous/unknown cities need a province supplied by the operator.
  const region = explicitRegion?.trim() || geo?.region || '';
  return { countrySlug, region, regionSlug: slugifyCity(region) };
}
