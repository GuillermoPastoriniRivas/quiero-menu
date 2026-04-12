'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function KitchenLoginPage() {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const authenticate = async (kitchenToken: string) => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/kitchen/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: kitchenToken }),
      });
      if (!res.ok) throw new Error('Token inválido');
      const data = await res.json();
      sessionStorage.setItem('kitchenToken', kitchenToken);
      sessionStorage.setItem('kitchenRestaurantId', data.restaurantId);
      router.push('/kitchen/board');
    } catch (err: any) {
      setError(err.message || 'Token inválido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      authenticate(tokenFromUrl);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await authenticate(token);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Cocina</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            {loading && <p className="text-sm text-muted-foreground text-center">Verificando token...</p>}
            <div className="space-y-2">
              <Label htmlFor="token">Token de acceso</Label>
              <Input id="token" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Pegá el token aquí" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Verificando...' : 'Ingresar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
