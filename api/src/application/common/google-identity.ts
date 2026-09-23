import { OAuth2Client } from 'google-auth-library';

export interface GoogleIdentity {
  email: string;
  name: string;
}

export interface GoogleIdentityVerifier {
  verify(credential: string): Promise<GoogleIdentity | null>;
}

export class GoogleIdTokenVerifier implements GoogleIdentityVerifier {
  private readonly client: OAuth2Client;

  constructor(private readonly clientId: string) {
    this.client = new OAuth2Client(clientId);
  }

  async verify(credential: string): Promise<GoogleIdentity | null> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken: credential,
        audience: this.clientId,
      });
      const payload = ticket.getPayload();
      if (!payload?.email || !payload.email_verified) return null;
      return {
        email: payload.email,
        name: payload.name ?? payload.email.split('@')[0],
      };
    } catch {
      return null;
    }
  }
}
