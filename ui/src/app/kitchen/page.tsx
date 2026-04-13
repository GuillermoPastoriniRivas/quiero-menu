'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MaterialIcon } from '@/components/ui/material-icon';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

function KitchenLoginForm() {
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
      if (!res.ok) throw new Error('Token invalido');
      const data = await res.json();
      sessionStorage.setItem('kitchenToken', kitchenToken);
      sessionStorage.setItem('kitchenRestaurantId', data.restaurantId);
      router.push('/kitchen/board');
    } catch (err: any) {
      setError(err.message || 'Token invalido');
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
    <div className="flex min-h-screen items-center justify-center px-4 bg-surface">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 w-12 h-12 rounded-full gradient-cta flex items-center justify-center">
            <MaterialIcon name="restaurant" size="lg" className="text-white" />
          </div>
          <CardTitle>Cocina</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-error-container/30 text-on-error-container px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}
            {loading && <p className="text-sm text-on-surface-variant text-center">Verificando token...</p>}
            <div className="space-y-2">
              <Label htmlFor="token">Token de acceso</Label>
              <Input id="token" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Pega el token aqui" required />
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

export default function KitchenLoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <MaterialIcon name="progress_activity" size="xl" className="animate-spin text-primary" />
      </div>
    }>
      <KitchenLoginForm />
    </Suspense>
  );
}
