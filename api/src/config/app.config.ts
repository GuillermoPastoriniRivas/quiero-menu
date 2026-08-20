function requireEnv(key: string, fallbackForDev?: string): string {
  const value = process.env[key];
  if (value) return value;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  if (fallbackForDev !== undefined) return fallbackForDev;
  throw new Error(`Missing required environment variable: ${key}`);
}

export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  mongodb: {
    uri: requireEnv('MONGODB_URI', 'mongodb://localhost:27017/quiero-menu'),
  },
  jwt: {
    secret: requireEnv('JWT_SECRET', 'dev-secret-do-not-use-in-prod'),
    expiresIn: process.env.JWT_EXPIRES_IN ?? '3d',
    refreshSecret: requireEnv(
      'JWT_REFRESH_SECRET',
      'dev-refresh-secret-do-not-use-in-prod',
    ),
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3001',
  internalToken: process.env.INTERNAL_API_TOKEN ?? '',
  customDomain: {
    ownDomains: (process.env.OWN_DOMAINS ?? 'quiero.menu,www.quiero.menu')
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean),
  },
  openai: {
    apiKey: requireEnv('OPENAI_API_KEY'),
    model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
  },
  s3: {
    bucket: process.env.S3_BUCKET ?? 'quiero-menu-images',
    region: process.env.S3_REGION ?? 'us-east-1',
    cloudfrontDomain:
      process.env.CLOUDFRONT_DOMAIN ?? 'd2y3u1bswha7un.cloudfront.net',
  },
  ses: {
    region: process.env.SES_REGION ?? 'us-east-1',
    fromEmail:
      process.env.SES_FROM_EMAIL ?? 'quiero.menu <no-reply@quiero.menu>',
  },
  lemonSqueezy: {
    apiKey: process.env.LEMON_SQUEEZY_API_KEY ?? '',
    storeId: process.env.LEMON_SQUEEZY_STORE_ID ?? '',
    webhookSecret: process.env.LEMON_SQUEEZY_WEBHOOK_SECRET ?? '',
    variants: {
      pro: process.env.LEMON_SQUEEZY_VARIANT_PRO ?? '',
    },
  },
  mercadoPago: {
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN ?? '',
    webhookSecret: process.env.MERCADO_PAGO_WEBHOOK_SECRET ?? '',
    amount: parseInt(process.env.MERCADO_PAGO_AMOUNT ?? '15000', 10),
    currency: process.env.MERCADO_PAGO_CURRENCY ?? 'ARS',
    trialDays: parseInt(process.env.MERCADO_PAGO_TRIAL_DAYS ?? '30', 10),
  },
  vapid: {
    publicKey:
      process.env.VAPID_PUBLIC_KEY ??
      'BJf6QtpJOjPEEei6210-omLn-Of425e-akBFvtNXxcfoN2n714AFPo_-RgEhZVJQX9NELwPWyKQY-RGXMJRMU7E',
    privateKey:
      process.env.VAPID_PRIVATE_KEY ??
      'ptGoYh-Ar72CosCzxTW1WRRjhxuUZtFpg3dlwyKU0zI',
    subject: process.env.VAPID_SUBJECT ?? 'mailto:soporte@quiero.menu',
  },
});
