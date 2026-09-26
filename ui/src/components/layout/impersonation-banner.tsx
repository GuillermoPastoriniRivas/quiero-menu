'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { hasAdminBackup, restoreBackedUpSession } from '@/lib/admin-session';
import { MaterialIcon } from '@/components/ui/material-icon';

export function ImpersonationBanner() {
  const [active, setActive] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const user = useAuthStore((s) => s.user);

  if (!active && hasAdminBackup()) {
    setActive(true);
  }

  if (!active) return null;

  const handleReturn = () => {
    setLeaving(true);
    const { restored, returnTo } = restoreBackedUpSession();
    window.location.assign(restored ? returnTo : '/login');
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 lg:bottom-4">
      <div className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-full bg-on-surface py-2 pl-4 pr-2 text-surface shadow-ambient-lg sm:w-auto">
        <MaterialIcon name={user?.operating ? 'edit' : 'swap_horiz'} size="sm" />
        <span className="flex-1 truncate text-xs font-semibold">
          {user?.operating
            ? `Editando ${user.restaurantName || 'este local'} como admin`
            : 'Estás viendo el panel del local como soporte'}
        </span>
        <button
          type="button"
          onClick={handleReturn}
          disabled={leaving}
          className="shrink-0 rounded-full bg-surface-container-lowest px-3 py-1.5 text-xs font-bold text-on-surface transition-colors hover:bg-surface-container-low disabled:opacity-60"
        >
          {leaving ? 'Volviendo...' : user?.operating ? 'Volver al admin' : 'Volver a mi cuenta'}
        </button>
      </div>
    </div>
  );
}
