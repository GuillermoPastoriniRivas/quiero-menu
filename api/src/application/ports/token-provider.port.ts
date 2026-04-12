export interface TokenPayload {
  sub: string;
  restaurantId: string;
  role: string;
}

export interface TokenProviderPort {
  signAccess(payload: TokenPayload): string;
  signRefresh(payload: TokenPayload): string;
  verifyAccess(token: string): TokenPayload;
  verifyRefresh(token: string): TokenPayload;
}
