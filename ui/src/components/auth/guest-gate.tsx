'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';

interface GuestGateProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function GuestGate({ children, redirectTo = '/dashboard' }: GuestGateProps) {
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrate = useAuthStore((s) => s.hydrate);
  const router = useRouter();

  const [checked, setChecked] = useState(false);
  const [occupied, setOccupied] = useState(false);

  if (!isLoading && !checked) {
    setChecked(true);
    if (isAuthenticated) setOccupied(true);
  }

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (checked && occupied) {
      router.replace(redirectTo);
    }
  }, [checked, occupied, router, redirectTo]);

  if (!checked || occupied) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
