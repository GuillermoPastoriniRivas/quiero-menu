import { randomBytes } from 'crypto';

// Crockford Base32: 32 símbolos sin I, L, O, U para evitar confusiones
// al dictar el token por WhatsApp (0/O, 1/I/L). 32^8 ~= 1.1 billones.
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const LENGTH = 8;

export function generateTrackingToken(): string {
  const bytes = randomBytes(LENGTH);
  let token = '';
  for (let i = 0; i < LENGTH; i += 1) {
    token += ALPHABET[bytes[i] & 31];
  }
  return token;
}

export function normalizeTrackingToken(raw: string): string {
  return raw.trim().toUpperCase();
}
