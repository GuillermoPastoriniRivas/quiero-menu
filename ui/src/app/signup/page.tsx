'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MaterialIcon } from '@/components/ui/material-icon';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantSlug, setRestaurantSlug] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen flex flex-col bg-surface">
      {/* Header */}
      <header className="flex justify-between items-center w-full px-6 h-16 sticky top-0 z-50 bg-surface">
        <div className="flex items-center gap-2">
          <MaterialIcon name="receipt_long" size="lg" className="text-primary" />
          <span className="font-extrabold text-xl tracking-tight text-on-background" style={{ fontFamily: 'var(--font-heading)' }}>Quiero Menu</span>
        </div>
        <Link href="/login" className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors">
          Iniciar sesion
        </Link>
      </header>

      {/* Main */}
      <main className="flex-grow flex items-center justify-center p-6 lg:p-12">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 bg-white rounded-3xl overflow-hidden shadow-ambient-lg">
          {/* Left panel — image */}
          <div className="relative hidden md:block bg-primary overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-container" />
            <div className="relative z-10 h-full flex flex-col justify-end p-10 text-white">
              <h2 className="text-3xl font-bold leading-tight mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                Potencia tu restaurante con elegancia digital.
              </h2>
              <p className="text-primary-fixed opacity-90">
                Unite a cientos de comercios que ya transformaron su gestion de pedidos con Quiero Menu.
              </p>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container blur-[80px] rounded-full opacity-50 -translate-y-1/2 translate-x-1/2" />
          </div>

          {/* Right panel — form */}
          <div className="p-8 lg:p-12 flex flex-col">
            {/* Progress */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-primary uppercase tracking-widest">Paso 1 de 2</span>
              </div>
              <div className="w-full bg-surface-container-low h-1.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full w-1/2 rounded-full" />
              </div>
            </div>

            <div className="mb-8">
              <h1 className="text-2xl font-bold text-on-surface mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Crea tu cuenta</h1>
              <p className="text-on-surface-variant text-sm">Crea tu cuenta y empieza a recibir pedidos</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-error-container/30 text-on-error-container px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-bold text-on-surface-variant ml-1">Tu nombre</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Juan" required />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-bold text-on-surface-variant ml-1">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@ejemplo.com" required />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-bold text-on-surface-variant ml-1">Contrasena</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <MaterialIcon name={showPassword ? 'visibility_off' : 'visibility'} size="sm" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="restaurantName" className="text-xs font-bold text-on-surface-variant ml-1">Nombre del restaurante</Label>
                <Input id="restaurantName" value={restaurantName} onChange={(e) => handleNameChange(e.target.value)} placeholder="La Famosa Pizzeria" required />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="slug" className="text-xs font-bold text-on-surface-variant ml-1">URL del menu</Label>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-on-surface-variant whitespace-nowrap">quiero.menu/</span>
                  <Input id="slug" value={restaurantSlug} onChange={(e) => setRestaurantSlug(e.target.value)} required />
                </div>
              </div>

              <Button type="submit" className="w-full mt-6" size="lg" disabled={loading}>
                <span>{loading ? 'Creando...' : 'Continuar'}</span>
                {!loading && <MaterialIcon name="arrow_forward" size="sm" className="group-hover/button:translate-x-0.5 transition-transform" />}
              </Button>
            </form>

            <div className="mt-auto pt-8 text-center">
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Al continuar, aceptas nuestros{' '}
                <a className="text-primary font-semibold" href="#">Terminos de Servicio</a> y{' '}
                <a className="text-primary font-semibold" href="#">Politica de Privacidad</a>.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-6 text-center">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 opacity-60">
            <MaterialIcon name="receipt" size="sm" className="text-on-surface" />
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface" style={{ fontFamily: 'var(--font-heading)' }}>Quiero Menu</span>
          </div>
          <div className="flex gap-6">
            <a className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors" href="#">Soporte</a>
            <a className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors" href="#">Contacto</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
