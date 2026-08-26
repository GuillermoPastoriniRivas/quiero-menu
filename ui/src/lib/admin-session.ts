import { api } from '@/lib/api';
import type { LoginResponse } from '@/types';

const BACKUP_KEY = 'qm-admin-session-backup';

interface BackedUpSession {
  accessToken: string;
  refreshToken: string;
  user: LoginResponse['user'];
}

/**
 * Guarda la sesión del admin antes de impersonar a un local, para poder
 * volver sin reloguear. Vive en sessionStorage: si se cierra la pestaña,
 * la próxima entrada es una sesión normal impersonada que expira sola.
 */
export function backupSessionForImpersonation(): void {
  if (typeof window === 'undefined') return;
  const accessToken = api.getAccessToken();
  const refreshToken = api.getRefreshToken();
  const rawUser =
    typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  if (!accessToken || !refreshToken || !rawUser) return;

  try {
    sessionStorage.setItem(
      BACKUP_KEY,
      JSON.stringify({
        accessToken,
        refreshToken,
        user: JSON.parse(rawUser),
      }),
    );
  } catch {
    // Storage lleno o privado: la impersonación funciona igual, solo no hay retorno.
  }
}

/** Restaura los tokens y el usuario del admin. Devuelve true si había backup. */
export function restoreBackedUpSession(): boolean {
  if (typeof window === 'undefined') return false;
  const raw = sessionStorage.getItem(BACKUP_KEY);
  if (!raw) return false;
  try {
    const session = JSON.parse(raw) as BackedUpSession;
    api.setTokens(session.accessToken, session.refreshToken);
    localStorage.setItem('user', JSON.stringify(session.user));
    sessionStorage.removeItem(BACKUP_KEY);
    return true;
  } catch {
    return false;
  }
}
