'use client';

import { useSyncExternalStore } from 'react';
import { behaviorEnabled, setBehaviorEnabled } from '@/lib/behavior';

function subscribe(callback: () => void) {
  window.addEventListener('qm:analytics-preference', callback);
  window.addEventListener('storage', callback);
  return () => { window.removeEventListener('qm:analytics-preference', callback); window.removeEventListener('storage', callback); };
}
export function AnalyticsPreference() {
  const enabled = useSyncExternalStore(subscribe, behaviorEnabled, () => false);
  return (
    <div className="mt-4 rounded-xl border border-outline-variant/30 p-4">
      <p className="text-sm">Medición opcional de navegación en este navegador: <strong>{enabled ? 'activada' : 'desactivada'}</strong>.</p>
      <button type="button" onClick={() => setBehaviorEnabled(!enabled)} className="mt-2 text-sm font-semibold text-primary underline">
        {enabled ? 'Desactivar medición de navegación' : 'Activar medición de navegación'}
      </button>
      <p className="mt-2 text-xs text-on-surface-variant">Respetamos Do Not Track y Global Privacy Control. Los pedidos, cobros y operaciones de cuenta siguen registrándose para prestar el servicio.</p>
    </div>
  );
}
