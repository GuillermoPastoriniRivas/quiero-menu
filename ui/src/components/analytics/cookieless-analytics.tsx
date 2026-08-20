'use client';

import Script from 'next/script';

const GOATCOUNTER_DOMAIN = process.env.NEXT_PUBLIC_GOATCOUNTER_DOMAIN;
const GOATCOUNTER_ENABLED =
  process.env.NEXT_PUBLIC_GOATCOUNTER_ENABLED === 'true';

export function CookielessAnalytics() {
  if (!GOATCOUNTER_ENABLED || !GOATCOUNTER_DOMAIN) {
    return null;
  }
  return (
    <Script
      id="goatcounter-analytics"
      data-goatcounter={`https://${GOATCOUNTER_DOMAIN}/count`}
      async
      src="//gc.zgo.at/count.js"
    />
  );
}