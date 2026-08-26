export interface TokenPayload {
  sub: string;
  restaurantId: string;
  role: string;
  /** Platform admin (quiero.menu staff). */
  plat?: boolean;
  /** Session issued via admin impersonation. */
  imp?: boolean;
}

export interface TokenProviderPort {
  signAccess(payload: TokenPayload): string;
  signRefresh(payload: TokenPayload): string;
  verifyAccess(token: string): TokenPayload;
  verifyRefresh(token: string): TokenPayload;
}
