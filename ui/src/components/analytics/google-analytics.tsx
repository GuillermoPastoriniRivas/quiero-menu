'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { useReportWebVitals } from 'next/web-vitals';
import { behaviorEnabled, internalViewer, mirrorAnalytics } from '@/lib/behavior';
import { createPageViewTracker } from '@/lib/analytics-page-view';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

function subscribe(callback: () => void) {
  window.addEventListener('qm:analytics-preference', callback);
  window.addEventListener('storage', callback);
  return () => { window.removeEventListener('qm:analytics-preference', callback); window.removeEventListener('storage', callback); };
}

export function GoogleAnalytics() {
  const enabled = useSyncExternalStore(subscribe, behaviorEnabled, () => false);
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const pageView = useRef(createPageViewTracker());

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;
    Object.assign(window, { [`ga-disable-${GA_MEASUREMENT_ID}`]: !enabled });
  }, [enabled]);

  useEffect(() => {
    pageView.current(pathname, ready && typeof window.gtag === 'function', enabled && !internalViewer(pathname.split('/')[1]), () => mirrorAnalytics('page_view'));
  }, [pathname, ready, enabled]);

  useReportWebVitals((metric) => {
    if (!GA_MEASUREMENT_ID || !enabled || typeof window.gtag !== 'function') return;
    window.gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_label: metric.id,
      non_interaction: true,
    });
  });

  if (!GA_MEASUREMENT_ID || !enabled) {
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
            gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false });
          `,
        }}
        onReady={() => {
          setReady(true);
        }}
      />
    </>
  );
}
