'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { analyticsPath, internalViewer, trackOwner, trackPublic, trackStorefront } from '@/lib/behavior';

const OWNER_PAGES = new Set(['dashboard', 'menu', 'mi-menu', 'business', 'apariencia', 'orders', 'analytics', 'customers', 'billing', 'account', 'coupons', 'promos', 'settings', 'publicar']);

export function BehaviorAnalytics() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  useEffect(() => {
    const section = pathname.split('/')[1];
    if (internalViewer()) return;
    if (pathname === '/') trackPublic('landing_view', {}, 'landing');
    else if (pathname === '/signup') trackPublic('signup_started', {}, 'signup');
    else if (section === 'locales' || section === 'en') trackPublic('directory_view', {}, `directory:${pathname}`);
    else if (OWNER_PAGES.has(section) && user?.restaurantId) trackOwner('owner_page_view', {}, `page:${analyticsPath(pathname)}`);

    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element)?.closest?.('a');
      if (!link) return;
      const url = new URL(link.href);
      if (url.searchParams.get('ref') === 'powered') trackPublic('powered_click');
      if (url.searchParams.get('ref') === 'dir') trackPublic('directory_result_click');
      const claim = /^\/([^/]+)\/reclamar$/.exec(url.pathname);
      if (claim) trackStorefront(claim[1], 'claim_click');
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [pathname, user?.restaurantId]);

  useEffect(() => {
    if (!user?.restaurantId || internalViewer()) return;
    let interacted = false;
    const active = () => { interacted = true; };
    document.addEventListener('pointerdown', active, { passive: true });
    document.addEventListener('keydown', active);
    const timer = setInterval(() => {
      if (interacted && document.visibilityState === 'visible') { trackOwner('owner_engaged'); interacted = false; }
    }, 60_000);
    return () => { clearInterval(timer); document.removeEventListener('pointerdown', active); document.removeEventListener('keydown', active); };
  }, [user?.restaurantId]);
  return null;
}
