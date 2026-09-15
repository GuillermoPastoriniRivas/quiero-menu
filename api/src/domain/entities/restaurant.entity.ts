import { RestaurantStatus } from '../enums/restaurant-status.enum.js';
import { RestaurantCategory } from '../enums/restaurant-category.enum.js';

export interface PaymentMethodsConfig {
  cashEnabled: boolean;
  cardEnabled: boolean;
  transferEnabled: boolean;
  transferBankName?: string;
  transferAccountType?: string;
  transferAccountNumber?: string;
  transferAccountHolder?: string;
  transferCbu?: string;
  transferAlias?: string;
  transferNotes?: string;
}

export interface StorefrontTheme {
  primaryColor: string;
}

export type CustomDomainStatus = {
  state: 'pending' | 'provisioning' | 'active' | 'failed';
  requestedAt?: Date;
  verifiedAt?: Date;
  failedReason?: string;
} | null;

/**
 * Imagen de la galería de una ficha de inventario.
 * - source 's3': subida por el equipo a nuestro bucket público (confiable).
 * - source 'external': link de terceros; el loader sólo publica URLs que
 *   responden 200 con Content-Type image/* (verificado con HEAD al insertar).
 */
export interface PhotoGalleryImage {
  url: string;
  source: 's3' | 'external';
  alt?: string;
}

export class Restaurant {
  constructor(
    public readonly id: string,
    public readonly slug: string,
    public readonly name: string,
    public readonly description: string,
    public readonly logoUrl: string,
    public readonly bannerUrl: string,
    public readonly address: string,
    public readonly city: string,
    public readonly country: string,
    public readonly coordinates: { lat: number; lng: number } | null,
    public readonly phone: string,
    public readonly timezone: string,
    public readonly currency: string,
    public readonly status: RestaurantStatus,
    /**
     * Override manual del estado abierto/cerrado.
     * - 'open'   => forzar abierto (ignora el horario).
     * - 'closed' => forzar cerrado (ignora el horario).
     * - null     => auto: sigue el horario programado.
     */
    public readonly openOverride: 'open' | 'closed' | null,
    public readonly customDomain: string | null,
    public readonly customDomainStatus: CustomDomainStatus,
    public readonly socialLinks: {
      instagram?: string;
      facebook?: string;
      tiktok?: string;
    } | null,
    public readonly paymentMethods: PaymentMethodsConfig,
    public readonly theme: StorefrontTheme,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    /** Rubro para el directorio (pizzeria, cafe, ...). undefined = sin clasificar. */
    public readonly category?: RestaurantCategory,
    /** Slug normalizado de la ciudad: join key de las páginas de directorio. */
    public readonly citySlug?: string,
    /** Provincia/departamento/estado visible (display, no normalizado). */
    public readonly region?: string,
    /** Join keys geo del directorio de 3 niveles (/en/{pais}/{region}/{ciudad}). */
    public readonly countrySlug?: string,
    public readonly regionSlug?: string,
    /**
     * true = el local ya tiene dueño (creado por signup o por admin con
     * cuenta). false = cargado como inventario, reclamable desde el
     * storefront. undefined (docs viejos) se lee como true.
     */
    public readonly claimed?: boolean,
    /** Galería de fotos de la ficha (inventario; la gestiona el equipo/scraper). */
    public readonly photoGallery?: PhotoGalleryImage[],
  ) {}
}
