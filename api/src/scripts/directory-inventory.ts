import { z } from 'zod';
import type { mongo } from 'mongoose';
import { deriveGeoFromCity } from '../application/common/geo.js';
import { slugifyCity } from '../application/common/slugify.js';
import { RestaurantCategory } from '../domain/enums/restaurant-category.enum.js';

const RESERVED_SLUGS = new Set([
  'en',
  'guias',
  'locales',
  'signup',
  'login',
  'admin',
  'dashboard',
  'account',
  'analytics',
  'api',
  'apariencia',
  'billing',
  'business',
  'coupons',
  'customers',
  'delivery',
  'forgot-password',
  'kitchen',
  'menu',
  'mi-menu',
  'onboarding',
  'orders',
  'promos',
  'publicar',
  'reset-password',
  'settings',
  'status',
  'tracking',
  'verify-email',
  'privacy',
  'terms',
]);
const publicUrl = z
  .string()
  .url()
  .refine((url) => /^https?:\/\//.test(url), 'URL pública http(s) requerida');

export const InventoryBatchSchema = z
  .array(
    z
      .object({
        slug: z
          .string()
          .min(2)
          .max(60)
          .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
          .refine((slug) => !RESERVED_SLUGS.has(slug), 'Slug reservado'),
        name: z.string().trim().min(1).max(120),
        city: z.string().trim().min(1).max(80),
        country: z.enum(['AR', 'UY', 'CO']).default('AR'),
        region: z.string().trim().min(1).max(80).optional(),
        category: z
          .nativeEnum(RestaurantCategory)
          .refine(
            (category) => category !== RestaurantCategory.NONE,
            'Elegí un rubro',
          ),
        address: z.string().trim().max(200).optional(),
        description: z.string().trim().max(500).optional(),
        phone: z.string().trim().max(30).optional(),
        logoUrl: publicUrl.optional(),
        bannerUrl: publicUrl.optional(),
        photoGallery: z
          .array(
            z
              .object({
                url: publicUrl,
                source: z.enum(['s3', 'external']),
                alt: z.string().max(200).optional(),
              })
              .strict(),
          )
          .min(1)
          .max(20)
          .optional(),
        coordinates: z
          .object({
            lat: z.number().min(-90).max(90),
            lng: z.number().min(-180).max(180),
          })
          .optional(),
        socialLinks: z
          .object({
            instagram: publicUrl.optional(),
            facebook: publicUrl.optional(),
            tiktok: publicUrl.optional(),
          })
          .optional(),
        sourceUrls: z.array(publicUrl).min(1).max(10),
      })
      .strict(),
  )
  .min(1)
  .max(500)
  .superRefine((rows, context) => {
    const seen = new Set<string>();
    for (const [i, row] of rows.entries()) {
      if (seen.has(row.slug))
        context.addIssue({
          code: 'custom',
          message: 'Slug repetido en el lote',
          path: [i, 'slug'],
        });
      seen.add(row.slug);
      if (
        !slugifyCity(row.city) ||
        !deriveGeoFromCity(row.city, row.country, row.region).regionSlug
      ) {
        context.addIssue({
          code: 'custom',
          message: 'Indicá provincia/departamento para esta ciudad',
          path: [i, 'region'],
        });
      }
    }
  });

export type InventoryRow = z.infer<typeof InventoryBatchSchema>[number];
type ImportResult = {
  slug: string;
  action: 'create' | 'fill' | 'unchanged' | 'protected' | 'duplicate';
  missingCoordinates: boolean;
};

/** Fichas only: never replaces menus, hours, subscriptions or owner data. */
export async function importDirectoryInventory(
  db: mongo.Db,
  input: unknown,
  apply = false,
): Promise<ImportResult[]> {
  // Validate the entire batch before issuing even one write.
  const rows = InventoryBatchSchema.parse(input);
  const restaurants = db.collection('restaurants');
  const results: ImportResult[] = [];
  for (const row of rows) {
    const geo = deriveGeoFromCity(row.city, row.country, row.region);
    const citySlug = slugifyCity(row.city);
    const existing = await restaurants.findOne({ slug: row.slug });
    if (
      existing &&
      (existing.claimed !== false ||
        existing.isDemo === true ||
        (existing.citySlug && existing.citySlug !== citySlug) ||
        (existing.countrySlug && existing.countrySlug !== geo.countrySlug) ||
        (existing.regionSlug && existing.regionSlug !== geo.regionSlug) ||
        (await db.collection('user_restaurants').findOne({
          restaurantId: { $in: [existing._id, String(existing._id)] },
        })))
    ) {
      results.push({
        slug: row.slug,
        action: 'protected',
        missingCoordinates: !existing.coordinates,
      });
      continue;
    }
    if (!existing) {
      const neighbors = await restaurants
        .find({
          citySlug,
          countrySlug: geo.countrySlug,
          regionSlug: geo.regionSlug,
        })
        .toArray();
      if (
        neighbors.some((other) => {
          const nameMatches =
            slugifyCity(String(other.name)) === slugifyCity(row.name);
          const address = slugifyCity(row.address ?? '');
          const otherAddress = slugifyCity(String(other.address ?? ''));
          const knownAddress = address && address !== citySlug;
          const knownOtherAddress = otherAddress && otherAddress !== citySlug;
          const addressesConflict =
            knownAddress && knownOtherAddress && address !== otherAddress;
          const phoneMatches =
            row.phone?.replace(/\D/g, '') &&
            String(other.phone ?? '').replace(/\D/g, '') ===
              row.phone.replace(/\D/g, '');
          // Un teléfono puede pertenecer a varios locales o sucursales.
          return (
            (nameMatches && !addressesConflict) ||
            Boolean(phoneMatches && knownAddress && address === otherAddress)
          );
        })
      ) {
        results.push({
          slug: row.slug,
          action: 'duplicate',
          missingCoordinates: !row.coordinates,
        });
        continue;
      }
    }
    const publicFields = {
      name: row.name,
      city: row.city,
      citySlug,
      country: row.country,
      ...geo,
      category: row.category,
      address: row.address,
      description: row.description,
      phone: row.phone,
      logoUrl: row.logoUrl,
      bannerUrl: row.bannerUrl,
      photoGallery: row.photoGallery,
      coordinates: row.coordinates,
      socialLinks: row.socialLinks,
      inventorySource: { urls: row.sourceUrls, importedAt: new Date() },
    };
    // Imported data only fills gaps; reviewed or owner-provided values win.
    const patch = Object.fromEntries(
      Object.entries(publicFields).filter(
        ([key, value]) =>
          value !== undefined &&
          value !== '' &&
          (!existing ||
            existing[key] === undefined ||
            existing[key] === null ||
            existing[key] === '' ||
            (Array.isArray(existing[key]) && existing[key].length === 0)),
      ),
    );
    let action: ImportResult['action'] = !existing
      ? 'create'
      : Object.keys(patch).length
        ? 'fill'
        : 'unchanged';
    if (apply) {
      const now = new Date();
      if (!existing) {
        const inserted = await restaurants.updateOne(
          { slug: row.slug },
          {
            $setOnInsert: {
              ...publicFields,
              address: row.address ?? '',
              description: row.description ?? '',
              phone: row.phone ?? '',
              coordinates: row.coordinates ?? null,
              socialLinks: row.socialLinks ?? null,
              slug: row.slug,
              claimed: false,
              status: 'active',
              logoUrl: row.logoUrl ?? '',
              bannerUrl: row.bannerUrl ?? '',
              photoGallery: row.photoGallery ?? [],
              currency:
                row.country === 'CO'
                  ? 'COP'
                  : row.country === 'UY'
                    ? 'UYU'
                    : 'ARS',
              timezone:
                row.country === 'CO'
                  ? 'America/Bogota'
                  : row.country === 'UY'
                    ? 'America/Montevideo'
                    : 'America/Argentina/Buenos_Aires',
              openOverride: null,
              customDomain: null,
              customDomainStatus: null,
              paymentMethods: {
                cashEnabled: false,
                cardEnabled: false,
                transferEnabled: false,
              },
              theme: { primaryColor: '#E8532C' },
              inventorySource: { urls: row.sourceUrls, importedAt: now },
              createdAt: now,
              updatedAt: now,
            },
          },
          { upsert: true },
        );
        if (!inserted.upsertedCount) action = 'protected';
      } else if (action === 'fill') {
        const filled = await restaurants.updateOne(
          {
            _id: existing._id,
            claimed: false,
            $and: Object.keys(patch).map((key) => ({
              $or: [
                { [key]: { $exists: false } },
                { [key]: null },
                { [key]: '' },
                ...(Array.isArray(patch[key]) ? [{ [key]: { $size: 0 } }] : []),
              ],
            })),
          },
          { $set: { ...patch, updatedAt: now } },
        );
        if (!filled.matchedCount) action = 'protected';
      }
      const stored = await restaurants.findOne({ slug: row.slug });
      if (stored?.claimed === false) {
        await db.collection('subscriptions').updateOne(
          { restaurantId: stored._id },
          {
            $setOnInsert: {
              restaurantId: stored._id,
              plan: 'free',
              status: 'active',
              paymentProvider: 'none',
              currentPeriodStart: now,
              currentPeriodEnd: null,
              canceledAt: null,
              externalCustomerId: null,
              externalSubscriptionId: null,
              createdAt: now,
              updatedAt: now,
            },
          },
          { upsert: true },
        );
      }
    }
    results.push({
      slug: row.slug,
      action,
      missingCoordinates: !(existing?.coordinates || row.coordinates),
    });
  }
  return results;
}
