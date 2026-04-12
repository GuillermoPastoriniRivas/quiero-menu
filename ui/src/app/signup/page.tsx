'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantSlug, setRestaurantSlug] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuthStore();
  const router = useRouter();

  const handleNameChange = (value: string) => {
    setRestaurantName(value);
    setRestaurantSlug(value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup({ name, email, password, restaurantName, restaurantSlug });
      router.push('/onboarding');
    } catch (err: any) {
      setError(err.message || 'Error al registrarte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Crear cuenta</CardTitle>
          <CardDescription>Registrá tu restaurante en quiero.menu</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="space-y-2">
              <Label htmlFor="name">Tu nombre</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="restaurantName">Nombre del restaurante</Label>
              <Input id="restaurantName" value={restaurantName} onChange={(e) => handleNameChange(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">URL del menú</Label>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">quiero.menu/</span>
                <Input id="slug" value={restaurantSlug} onChange={(e) => setRestaurantSlug(e.target.value)} required />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creando...' : 'Crear cuenta'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              ¿Ya tenés cuenta?{' '}
              <Link href="/login" className="text-primary underline">Ingresá</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
