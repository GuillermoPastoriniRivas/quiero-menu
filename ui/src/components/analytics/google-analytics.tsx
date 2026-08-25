'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { useReportWebVitals } from 'next/web-vitals';
import { useConsentStore } from '@/stores/consent.store';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function GoogleAnalytics() {
  const consent = useConsentStore((s) => s.status);
  const hydrate = useConsentStore((s) => s.hydrate);
  const [embedded] = useState(
    () => typeof window !== 'undefined' && window.self !== window.top,
  );

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useReportWebVitals((metric) => {
    if (!GA_MEASUREMENT_ID || embedded || consent !== 'granted') return;
    window.gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_label: metric.id,
      non_interaction: true,
    });
  });

  if (!GA_MEASUREMENT_ID || embedded || consent !== 'granted') {
    return null;
  }

  return (
    <>
      <Script
        id="google-analytics-src"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="google-analytics-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `,
        }}
      />
    </>
  );
}