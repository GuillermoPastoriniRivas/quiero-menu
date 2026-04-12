const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private onUnauthorized: (() => void) | null = null;

  setTokens(access: string, refresh: string) {
    this.accessToken = access;
    this.refreshToken = refresh;
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
    }
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  hydrate() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken');
      this.refreshToken = localStorage.getItem('refreshToken');
    }
  }

  getAccessToken() {
    return this.accessToken;
  }

  setOnUnauthorized(cb: () => void) {
    this.onUnauthorized = cb;
  }

  private async request<T>(method: string, path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    const url = `${API_URL}${path}`;
    const opts: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {}),
        ...headers,
      },
    };
    if (body) opts.body = JSON.stringify(body);

    let res = await fetch(url, opts);

    if (res.status === 401 && this.refreshToken) {
      const refreshed = await this.tryRefresh();
      if (refreshed) {
        opts.headers = {
          ...opts.headers as Record<string, string>,
          Authorization: `Bearer ${this.accessToken}`,
        };
        res = await fetch(url, opts);
      }
    }

    if (res.status === 401) {
      this.clearTokens();
      this.onUnauthorized?.();
      throw new ApiError(401, 'Unauthorized');
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({ message: res.statusText }));
      throw new ApiError(res.status, data.message || res.statusText);
    }

    if (res.status === 204) return undefined as T;
    return res.json();
  }

  private async tryRefresh(): Promise<boolean> {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      this.setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  get<T>(path: string) {
    return this.request<T>('GET', path);
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>('POST', path, body);
  }

  patch<T>(path: string, body?: unknown) {
    return this.request<T>('PATCH', path, body);
  }

  delete<T>(path: string) {
    return this.request<T>('DELETE', path);
  }

  async postFormData<T>(path: string, formData: FormData): Promise<T> {
    const url = `${API_URL}${path}`;
    const headers: Record<string, string> = {};
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    let res = await fetch(url, { method: 'POST', headers, body: formData });

    if (res.status === 401 && this.refreshToken) {
      const refreshed = await this.tryRefresh();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        res = await fetch(url, { method: 'POST', headers, body: formData });
      }
    }

    if (res.status === 401) {
      this.clearTokens();
      this.onUnauthorized?.();
      throw new ApiError(401, 'Unauthorized');
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({ message: res.statusText }));
      throw new ApiError(res.status, data.message || res.statusText);
    }

    return res.json();
  }
}

export const api = new ApiClient();
