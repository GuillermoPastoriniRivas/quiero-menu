import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

const APP_ROUTES = [
  '/account',
  '/admin',
  '/analytics',
  '/api/',
  '/apariencia',
  '/billing',
  '/business',
  '/coupons',
  '/customers',
  '/dashboard',
  '/delivery',
  '/forgot-password',
  '/kitchen',
  '/login',
  '/menu',
  '/onboarding',
  '/orders',
  '/publicar',
  '/reset-password',
  '/settings',
  '/signup',
  '/status',
  '/tracking',
  '/verify-email',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: APP_ROUTES,
    },
    sitemap: 'https://quiero.menu/sitemap.xml',
    host: 'https://quiero.menu',
  };
}