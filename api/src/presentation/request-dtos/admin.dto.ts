import { z } from 'zod';
import { RestaurantCategory } from '../../domain/enums/restaurant-category.enum.js';

/** Imagen de la galería de la ficha. El loader valida la URL antes de enviar. */
export const PhotoGalleryImageSchema = z.object({
  url: z.string().url().min(8).max(2000),
  source: z.enum(['s3', 'external']),
  alt: z.string().max(120).optional(),
});
export type PhotoGalleryImageDto = z.infer<typeof PhotoGalleryImageSchema>;
const PhotoGallerySchema = z.array(PhotoGalleryImageSchema).max(12).optional();

export const AdminSearchRequestSchema = z.object({
  q: z.string().max(120).optional().default(''),
});
export type AdminSearchRequestDto = z.infer<typeof AdminSearchRequestSchema>;

export const AdminCreateRestaurantRequestSchema = z.object({
  ownerName: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8),
  restaurantName: z.string().min(1).max(120),
  restaurantSlug: z
    .string()
    .min(2)
    .max(60)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must be lowercase alphanumeric with hyphens',
    ),
  city: z.string().max(80).optional(),
  category: z.nativeEnum(RestaurantCategory).optional(),
  currency: z.string().length(3).optional(),
  timezone: z.string().max(60).optional(),
  sendOwnerEmails: z.boolean().optional(),
});
export type AdminCreateRestaurantRequestDto = z.infer<
  typeof AdminCreateRestaurantRequestSchema
>;

export const AdminAuditLogsRequestSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
});
export type AdminAuditLogsRequestDto = z.infer<
  typeof AdminAuditLogsRequestSchema
>;

export const AdminSearchTermsRequestSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
});
export type AdminSearchTermsRequestDto = z.infer<
  typeof AdminSearchTermsRequestSchema
>;

export const AdminApproveClaimRequestSchema = z.object({
  ownerName: z.string().min(1).max(120),
  email: z.string().email(),
});
export type AdminApproveClaimRequestDto = z.infer<
  typeof AdminApproveClaimRequestSchema
>;

export const AdminCreateUnclaimedRestaurantRequestSchema = z.object({
  restaurantName: z.string().min(1).max(120),
  restaurantSlug: z
    .string()
    .min(2)
    .max(60)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must be lowercase alphanumeric with hyphens',
    ),
  city: z.string().max(80).optional(),
  category: z.nativeEnum(RestaurantCategory).optional(),
  currency: z.string().length(3).optional(),
  timezone: z.string().max(60).optional(),
  // Datos públicos para la ficha del inventario (enriquecen el reclamo).
  address: z.string().max(200).optional(),
  phone: z.string().max(30).optional(),
  description: z.string().max(500).optional(),
  photoGallery: PhotoGallerySchema,
});
export type AdminCreateUnclaimedRestaurantRequestDto = z.infer<
  typeof AdminCreateUnclaimedRestaurantRequestSchema
>;

/** Edicion de ficha desde el panel admin (locales del inventario y con dueño). */
export const AdminUpdateRestaurantRequestSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(80).optional(),
  region: z.string().max(80).optional(),
  country: z.string().max(60).optional(),
  category: z.nativeEnum(RestaurantCategory).optional(),
  phone: z.string().max(30).optional(),
  /** Reemplazo total de la galería: array completo o campo ausente = sin tocar. */
  photoGallery: PhotoGallerySchema,
});
export type AdminUpdateRestaurantRequestDto = z.infer<
  typeof AdminUpdateRestaurantRequestSchema
>;

export const AdminAssignFeaturedRequestSchema = z.object({
  restaurantId: z.string().min(1),
  scope: z.enum(['category', 'home']),
  days: z.coerce.number().int().min(1).max(365).optional().default(30),
});
export type AdminAssignFeaturedRequestDto = z.infer<
  typeof AdminAssignFeaturedRequestSchema
>;

export const AdminCreateInvitationRequestSchema = z.object({
  email: z.union([z.string().trim().email(), z.literal('')]).optional(),
  sendEmail: z.boolean().optional(),
});
export type AdminCreateInvitationRequestDto = z.infer<
  typeof AdminCreateInvitationRequestSchema
>;
