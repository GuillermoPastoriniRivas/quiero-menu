import { createHash, randomBytes } from 'crypto';

export const INVITATION_TTL_DAYS = 14;

export function generateInvitationToken(): { raw: string; hash: string } {
  const raw = randomBytes(24).toString('base64url');
  return { raw, hash: hashInvitationToken(raw) };
}

export function hashInvitationToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export function invitationUrl(frontendUrl: string, raw: string): string {
  return `${frontendUrl.replace(/\/+$/, '')}/invitacion/${raw}`;
}
