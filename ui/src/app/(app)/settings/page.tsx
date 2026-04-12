'use client';

import { useEffect, useState } from 'react';
import { useRestaurantStore } from '@/stores/restaurant.store';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import type { OperatingHours, DeliveryZone, KitchenAccessToken } from '@/types';
import { toast } from 'sonner';
import { Copy, Trash2, Plus } from 'lucide-react';

export default function SettingsPage() {
  const { restaurant, fetch: fetchRestaurant, update } = useRestaurantStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [currency, setCurrency] = useState('');
  const [saving, setSaving] = useState(false);

  // Delivery zones
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZonePrice, setNewZonePrice] = useState('');

  // Kitchen tokens
  const [tokens, setTokens] = useState<KitchenAccessToken[]>([]);
  const [newTokenName, setNewTokenName] = useState('');

  // Operating hours
  const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const defaultHours: Omit<OperatingHours, 'id' | 'restaurantId'>[] = Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i + 1,
    opensAt: '09:00',
    closesAt: '22:00',
    isClosed: false,
  }));
  const [hours, setHours] = useState(defaultHours);
  const [savingHours, setSavingHours] = useState(false);
  const { updateHours } = useRestaurantStore();

  useEffect(() => {
    fetchRestaurant();
    loadZones();
    loadTokens();
  }, []);

  useEffect(() => {
    if (restaurant) {
      setName(restaurant.name);
      setDescription(restaurant.description);
      setPhone(restaurant.phone);
      setAddress(restaurant.address);
      setCity(restaurant.city);
      setCurrency(restaurant.currency);
    }
  }, [restaurant]);

  const loadZones = async () => {
    const data = await api.get<DeliveryZone[]>('/delivery-zones');
    setZones(data);
  };

  const loadTokens = async () => {
    const data = await api.get<KitchenAccessToken[]>('/kitchen/tokens');
    setTokens(data);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await update({ name, description, phone, address, city, currency });
      toast.success('Configuración guardada');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateZone = async () => {
    if (!newZoneName || !newZonePrice) return;
    await api.post('/delivery-zones', { name: newZoneName, price: Number(newZonePrice) });
    setNewZoneName('');
    setNewZonePrice('');
    loadZones();
    toast.success('Zona creada');
  };

  const handleDeleteZone = async (id: string) => {
    await api.delete(`/delivery-zones/${id}`);
    loadZones();
    toast.success('Zona eliminada');
  };

  const handleCreateToken = async () => {
    await api.post('/kitchen/tokens', { name: newTokenName });
    setNewTokenName('');
    loadTokens();
    toast.success('Token creado');
  };

  const handleRevokeToken = async (id: string) => {
    await api.delete(`/kitchen/tokens/${id}`);
    loadTokens();
    toast.success('Token revocado');
  };

  const getKitchenUrl = (token: string) => `${window.location.origin}/kitchen?token=${token}`;

  const copyKitchenLink = (token: string) => {
    navigator.clipboard.writeText(getKitchenUrl(token));
    toast.success('Link de cocina copiado');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configuración</h1>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="delivery">Zonas de delivery</TabsTrigger>
          <TabsTrigger value="kitchen">Cocina</TabsTrigger>
          <TabsTrigger value="hours">Horarios</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Datos del restaurante</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>Nombre</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div className="space-y-2"><Label>Teléfono (WhatsApp)</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+57..." /></div>
                <div className="space-y-2"><Label>Dirección</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
                <div className="space-y-2"><Label>Ciudad</Label><Input value={city} onChange={(e) => setCity(e.target.value)} /></div>
                <div className="space-y-2"><Label>Moneda</Label><Input value={currency} onChange={(e) => setCurrency(e.target.value)} /></div>
              </div>
              <div className="space-y-2"><Label>Descripción</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></div>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
            </CardContent>
          </Card>
          {restaurant && (
            <Card>
              <CardHeader>
                <CardTitle>Link público</CardTitle>
                <CardDescription>Compartí este link con tus clientes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Input value={`${window.location.origin}/${restaurant.slug}`} readOnly />
                  <Button variant="outline" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/${restaurant.slug}`); toast.success('Link copiado'); }}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="delivery" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Zonas de delivery</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Nombre de zona" value={newZoneName} onChange={(e) => setNewZoneName(e.target.value)} />
                <Input type="number" placeholder="Precio" value={newZonePrice} onChange={(e) => setNewZonePrice(e.target.value)} className="w-32" />
                <Button onClick={handleCreateZone}><Plus className="mr-1 h-4 w-4" />Agregar</Button>
              </div>
              {zones.map((zone) => (
                <div key={zone.id} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <span className="font-medium">{zone.name}</span>
                    <span className="ml-2 text-sm text-muted-foreground">${zone.price.toLocaleString()}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteZone(zone.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kitchen" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Tokens de cocina</CardTitle>
              <CardDescription>Generá tokens para que cocina acceda sin login</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Nombre (ej: Cocina principal)" value={newTokenName} onChange={(e) => setNewTokenName(e.target.value)} />
                <Button onClick={handleCreateToken}><Plus className="mr-1 h-4 w-4" />Generar</Button>
              </div>
              {tokens.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-md border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{t.name || 'Sin nombre'}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{getKitchenUrl(t.token)}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => copyKitchenLink(t.token)}><Copy className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleRevokeToken(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Horarios de atención</CardTitle>
              <CardDescription>Configurá los horarios de apertura y cierre para cada día</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {hours.map((h, i) => (
                <div key={h.dayOfWeek} className="flex items-center gap-4 rounded-md border p-3">
                  <span className="w-24 font-medium">{DAY_NAMES[i]}</span>
                  <div className="flex items-center gap-2">
                    <Switch checked={h.isClosed} onCheckedChange={(checked) => setHours((prev) => prev.map((row, j) => j === i ? { ...row, isClosed: checked } : row))} />
                    <Label className="text-sm text-muted-foreground">Cerrado</Label>
                  </div>
                  <Input type="time" value={h.opensAt} disabled={h.isClosed} className="w-32" onChange={(e) => setHours((prev) => prev.map((row, j) => j === i ? { ...row, opensAt: e.target.value } : row))} />
                  <span className="text-muted-foreground">a</span>
                  <Input type="time" value={h.closesAt} disabled={h.isClosed} className="w-32" onChange={(e) => setHours((prev) => prev.map((row, j) => j === i ? { ...row, closesAt: e.target.value } : row))} />
                </div>
              ))}
              <Button disabled={savingHours} onClick={async () => {
                setSavingHours(true);
                try {
                  await updateHours(hours);
                  toast.success('Horarios guardados');
                } catch (err: any) {
                  toast.error(err.message);
                } finally {
                  setSavingHours(false);
                }
              }}>{savingHours ? 'Guardando...' : 'Guardar horarios'}</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
