import { api } from '@/lib/api';
import type { LoginResponse } from '@/types';

const BACKUP_KEY = 'qm-admin-session-backup';

interface BackedUpSession {
  accessToken: string;
  refreshToken: string;
  user: LoginResponse['user'];
  returnTo?: string;
}

export function hasAdminBackup(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(BACKUP_KEY) !== null;
  } catch {
    return false;
  }
}

export function backupSessionForImpersonation(returnTo?: string): void {
  if (typeof window === 'undefined') return;
  const accessToken = api.getAccessToken();
  const refreshToken = api.getRefreshToken();
  const rawUser = localStorage.getItem('user');
  if (!accessToken || !refreshToken || !rawUser) return;
  try {
    const existing = sessionStorage.getItem(BACKUP_KEY);
    if (existing) {
      const parsed = JSON.parse(existing) as BackedUpSession;
      sessionStorage.setItem(BACKUP_KEY, JSON.stringify({ ...parsed, returnTo: returnTo ?? parsed.returnTo }));
      return;
    }
    sessionStorage.setItem(
      BACKUP_KEY,
      JSON.stringify({ accessToken, refreshToken, user: JSON.parse(rawUser), returnTo }),
    );
  } catch {
    return;
  }
}

export function restoreBackedUpSession(): { restored: boolean; returnTo: string } {
  const fallback = { restored: false, returnTo: '/admin/locales' };
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = sessionStorage.getItem(BACKUP_KEY);
    if (!raw) return fallback;
    const session = JSON.parse(raw) as BackedUpSession;
    api.setTokens(session.accessToken, session.refreshToken);
    localStorage.setItem('user', JSON.stringify(session.user));
    sessionStorage.removeItem(BACKUP_KEY);
    return { restored: true, returnTo: session.returnTo ?? '/admin/locales' };
  } catch {
    return fallback;
  }
}

export async function operateRestaurant(restaurantId: string, target = '/dashboard'): Promise<void> {
  const session = await api.post<LoginResponse>(`/admin/restaurants/${restaurantId}/operate`, {});
  backupSessionForImpersonation(`/admin/locales/${restaurantId}`);
  api.setTokens(session.accessToken, session.refreshToken);
  localStorage.setItem('user', JSON.stringify(session.user));
  window.location.assign(target);
}
