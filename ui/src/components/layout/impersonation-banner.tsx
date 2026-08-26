'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { restoreBackedUpSession } from '@/lib/admin-session';
import { MaterialIcon } from '@/components/ui/material-icon';

/**
 * Barra visible cuando un admin está impersonando un local.
 * Permite volver a la sesión del admin sin reloguear.
 */
export function ImpersonationBanner() {
  const [active, setActive] = useState(false);
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();

  const hasBackup =
    typeof window !== 'undefined' &&
    sessionStorage.getItem('qm-admin-session-backup') !== null;
  if (hasBackup && !active) {
    setActive(true);
  }

  if (!active) return null;

  const handleReturn = () => {
    if (restoreBackedUpSession()) {
      const rawUser =
        typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (rawUser) {
        try {
          setUser(JSON.parse(rawUser));
        } catch {
          // Usuario corrupto: hydrate lo va a arreglar con /auth/me.
        }
      }
      router.push('/admin/locales');
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-20 lg:bottom-4 z-50 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-3 bg-on-surface text-surface rounded-full pl-4 pr-2 py-2 shadow-ambient-lg max-w-md w-full sm:w-auto">
        <MaterialIcon name="swap_horiz" size="sm" />
        <span className="text-xs font-semibold truncate flex-1">
          Estás viendo el panel del local como soporte
        </span>
        <button
          type="button"
          onClick={handleReturn}
          className="shrink-0 text-xs font-bold bg-surface-container-lowest text-on-surface rounded-full px-3 py-1.5 hover:bg-surface-container-low transition-colors"
        >
          Volver a mi cuenta
        </button>
      </div>
    </div>
  );
}
