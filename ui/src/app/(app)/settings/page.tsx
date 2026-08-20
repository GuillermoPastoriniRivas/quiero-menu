"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useRestaurantStore } from "@/stores/restaurant.store";
import { useAuthStore } from "@/stores/auth.store";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import type {
  OperatingHours,
  DeliveryZone,
  KitchenAccessToken,
  DeliveryAccessToken,
  PaymentMethodsConfig,
} from "@/types";
import { toast } from "sonner";
import { MaterialIcon } from "@/components/ui/material-icon";
import {
  subscribeStaffPush,
  unsubscribePush,
  isPushSupported,
  isPushSubscribed,
} from "@/lib/push";

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsPageInner />
    </Suspense>
  );
}

function SettingsPageInner() {
  const { restaurant, fetch: fetchRestaurant, update } = useRestaurantStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [currency, setCurrency] = useState("");
  const [slug, setSlug] = useState("");
  const [instagram, setInstagram] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingSlug, setSavingSlug] = useState(false);

  // Payment methods
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodsConfig>({
    cashEnabled: true,
    cardEnabled: true,
    transferEnabled: true,
  });
  const [savingPayments, setSavingPayments] = useState(false);

  // Delivery zones
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [newZoneName, setNewZoneName] = useState("");
  const [newZonePrice, setNewZonePrice] = useState("");

  // Kitchen tokens
  const [tokens, setTokens] = useState<KitchenAccessToken[]>([]);

  // Delivery tokens
  const [deliveryTokens, setDeliveryTokens] = useState<DeliveryAccessToken[]>(
    [],
  );

  // Operating hours
  const DAY_NAMES = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];
  const defaultHours: Omit<OperatingHours, "id" | "restaurantId">[] =
    Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      opensAt: "09:00",
      closesAt: "22:00",
      isClosed: false,
    }));
  const [hours, setHours] = useState(defaultHours);
  const [savingHours, setSavingHours] = useState(false);
  const { updateHours, operatingHours } = useRestaurantStore();

  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>(
    searchParams.get("tab") ?? "general",
  );

  // Notifications (web push)
  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const supported = await isPushSupported();
      setPushSupported(supported);
      if (supported) setPushEnabled(await isPushSubscribed());
    })();
  }, []);

  const handleTogglePush = async (enabled: boolean) => {
    setPushBusy(true);
    try {
      if (enabled) {
        const token = api.getAccessToken();
        if (!token) return;
        const ok = await subscribeStaffPush(token);
        if (!ok) {
          toast.error("No se pudo activar. Revisá los permisos del navegador.");
          return;
        }
        setPushEnabled(true);
        toast.success("Notificaciones activadas");
      } else {
        await unsubscribePush();
        setPushEnabled(false);
        toast.success("Notificaciones desactivadas");
      }
    } catch {
      toast.error("Error al cambiar notificaciones");
    } finally {
      setPushBusy(false);
    }
  };

  useEffect(() => {
    fetchRestaurant();
    loadZones();
    loadTokens();
    loadDeliveryTokens();
  }, []);

  // Cargar los horarios guardados (no pisar con defaults al guardar)
  useEffect(() => {
    if (operatingHours.length > 0) {
      setHours(
        operatingHours.map((h) => ({
          dayOfWeek: h.dayOfWeek,
          opensAt: h.opensAt,
          closesAt: h.closesAt,
          isClosed: h.isClosed,
        })),
      );
    }
  }, [operatingHours]);

  useEffect(() => {
    if (restaurant) {
      setName(restaurant.name);
      setDescription(restaurant.description);
      setPhone(restaurant.phone);
      setAddress(restaurant.address);
      setCity(restaurant.city);
      setCurrency(restaurant.currency);
      setSlug(restaurant.slug);
      setInstagram(restaurant.socialLinks?.instagram || "");
      if (restaurant.paymentMethods) {
        setPaymentMethods(restaurant.paymentMethods);
      }
    }
  }, [restaurant]);

  const loadZones = async () => {
    const data = await api.get<DeliveryZone[]>("/delivery-zones");
    setZones(data);
  };

  const loadTokens = async () => {
    const data = await api.get<KitchenAccessToken[]>("/kitchen/tokens");
    setTokens(data);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await update({
        name,
        description,
        phone,
        address,
        city,
        currency,
        socialLinks: { instagram: instagram || undefined },
      });
      toast.success("Configuración guardada");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSlug = async () => {
    const candidate = slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    if (!candidate || candidate.length < 2) {
      toast.error("La URL debe tener al menos 2 caracteres");
      return;
    }
    setSavingSlug(true);
    try {
      await update({ slug: candidate });
      setSlug(candidate);
      const user = useAuthStore.getState().user;
      if (user) {
        useAuthStore.setState({ user: { ...user, restaurantSlug: candidate } });
      }
      toast.success("URL actualizada");
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 409) {
        toast.error("Esa URL ya esta en uso. Proba con otra.");
      } else {
        toast.error(err.message || "Error al actualizar la URL");
      }
    } finally {
      setSavingSlug(false);
    }
  };

  const handleCreateZone = async () => {
    if (!newZoneName || !newZonePrice) return;
    await api.post("/delivery-zones", {
      name: newZoneName,
      price: Number(newZonePrice),
    });
    setNewZoneName("");
    setNewZonePrice("");
    loadZones();
    toast.success("Zona creada");
  };

  const handleDeleteZone = async (id: string) => {
    await api.delete(`/delivery-zones/${id}`);
    loadZones();
    toast.success("Zona eliminada");
  };

  const handleCreateToken = async () => {
    const name = `Vista ${tokens.length + 1}`;
    await api.post("/kitchen/tokens", { name });
    loadTokens();
    toast.success("Acceso creado");
  };

  const handleRevokeToken = async (id: string) => {
    await api.delete(`/kitchen/tokens/${id}`);
    loadTokens();
    toast.success("Acceso eliminado");
  };

  const getKitchenUrl = (token: string) =>
    `${window.location.origin}/kitchen/${token}`;

  const copyKitchenLink = (token: string) => {
    navigator.clipboard.writeText(getKitchenUrl(token));
    toast.success("Link copiado");
  };

  const loadDeliveryTokens = async () => {
    const data = await api.get<DeliveryAccessToken[]>("/delivery/tokens");
    setDeliveryTokens(data);
  };

  const handleCreateDeliveryToken = async () => {
    const name = `Delivery ${deliveryTokens.length + 1}`;
    await api.post("/delivery/tokens", { name });
    loadDeliveryTokens();
    toast.success("Acceso delivery creado");
  };

  const handleRevokeDeliveryToken = async (id: string) => {
    await api.delete(`/delivery/tokens/${id}`);
    loadDeliveryTokens();
    toast.success("Acceso delivery eliminado");
  };

  const getDeliveryUrl = (token: string) =>
    `${window.location.origin}/delivery/${token}`;

  const copyDeliveryLink = (token: string) => {
    navigator.clipboard.writeText(getDeliveryUrl(token));
    toast.success("Link copiado");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configuración</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto overflow-y-hidden -mx-1 px-1">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="payments">Pagos</TabsTrigger>
            <TabsTrigger value="delivery">Zonas de delivery</TabsTrigger>
            <TabsTrigger value="hours">Horarios</TabsTrigger>
            <TabsTrigger value="billing">Plan y facturación</TabsTrigger>
            <span
              className="mx-1.5 h-5 w-px shrink-0 bg-outline-variant/40"
              aria-hidden="true"
            />
            <TabsTrigger value="kitchen">Cocina</TabsTrigger>
            <TabsTrigger value="delivery-portal">Delivery</TabsTrigger>
            <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Datos del restaurante</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link
                href="/apariencia"
                className="flex items-center justify-between rounded-xl border border-outline-variant/20 bg-surface-container-low/60 p-4 hover:bg-surface-container-low transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl gradient-cta flex items-center justify-center text-white shrink-0">
                    <MaterialIcon name="palette" size="md" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">
                      Logo, banner y color de botones
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Personalizá el look de tu menú público y mirá cómo queda
                      antes de publicarlo
                    </p>
                  </div>
                </div>
                <MaterialIcon
                  name="chevron_right"
                  size="md"
                  className="text-on-surface-variant"
                />
              </Link>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono (WhatsApp)</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+57..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dirección</Label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ciudad</Label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Moneda</Label>
                  <Input
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Sobre nosotros</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Contale a tus clientes sobre tu negocio"
                />
              </div>
              <div className="space-y-2 pt-2">
                <Label className="text-base font-semibold">
                  Redes sociales
                </Label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Instagram</Label>
                    <Input
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="@tucuenta"
                    />
                  </div>
                </div>
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </CardContent>
          </Card>
          {restaurant && (
            <Card>
              <CardHeader>
                <CardTitle>Link público</CardTitle>
                <CardDescription>
                  Compartí este link con tus clientes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Label>URL de tu menu</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    quiero.menu/
                  </span>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="mi-restaurante"
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={handleSaveSlug}
                    disabled={
                      savingSlug ||
                      !slug.trim() ||
                      slug.trim() === restaurant?.slug
                    }
                  >
                    {savingSlug ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={`${window.location.origin}/${restaurant.slug}`}
                    readOnly
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/${restaurant.slug}`,
                      );
                      toast.success("Link copiado");
                    }}
                  >
                    <MaterialIcon name="content_copy" size="sm" />
                  </Button>
                </div>
                <a
                  href="/publicar"
                  className="inline-flex items-center gap-1 text-sm text-primary font-medium hover:underline"
                >
                  <MaterialIcon name="qr_code_2" size="sm" />
                  QR, WhatsApp y mas opciones
                </a>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="payments" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Metodos de pago</CardTitle>
              <CardDescription>
                Activa o desactiva los metodos de pago que aceptas en tu
                storefront
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Efectivo</p>
                  <p className="text-sm text-muted-foreground">
                    El cliente paga en efectivo al recibir el pedido
                  </p>
                </div>
                <Switch
                  checked={paymentMethods.cashEnabled}
                  onCheckedChange={(checked) =>
                    setPaymentMethods((p) => ({ ...p, cashEnabled: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Tarjeta</p>
                  <p className="text-sm text-muted-foreground">
                    El cliente paga con tarjeta al recibir el pedido
                  </p>
                </div>
                <Switch
                  checked={paymentMethods.cardEnabled}
                  onCheckedChange={(checked) =>
                    setPaymentMethods((p) => ({ ...p, cardEnabled: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Transferencia</p>
                  <p className="text-sm text-muted-foreground">
                    El cliente transfiere antes de recibir el pedido
                  </p>
                </div>
                <Switch
                  checked={paymentMethods.transferEnabled}
                  onCheckedChange={(checked) =>
                    setPaymentMethods((p) => ({
                      ...p,
                      transferEnabled: checked,
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {paymentMethods.transferEnabled && (
            <Card>
              <CardHeader>
                <CardTitle>Datos para transferencia</CardTitle>
                <CardDescription>
                  Estos datos se muestran al cliente cuando elige pagar por
                  transferencia
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Banco</Label>
                    <Input
                      value={paymentMethods.transferBankName || ""}
                      onChange={(e) =>
                        setPaymentMethods((p) => ({
                          ...p,
                          transferBankName: e.target.value,
                        }))
                      }
                      placeholder="Ej: Banco Nacion"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de cuenta</Label>
                    <Input
                      value={paymentMethods.transferAccountType || ""}
                      onChange={(e) =>
                        setPaymentMethods((p) => ({
                          ...p,
                          transferAccountType: e.target.value,
                        }))
                      }
                      placeholder="Ej: Cuenta corriente"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Numero de cuenta</Label>
                    <Input
                      value={paymentMethods.transferAccountNumber || ""}
                      onChange={(e) =>
                        setPaymentMethods((p) => ({
                          ...p,
                          transferAccountNumber: e.target.value,
                        }))
                      }
                      placeholder="Ej: 123-456789/0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Titular</Label>
                    <Input
                      value={paymentMethods.transferAccountHolder || ""}
                      onChange={(e) =>
                        setPaymentMethods((p) => ({
                          ...p,
                          transferAccountHolder: e.target.value,
                        }))
                      }
                      placeholder="Nombre del titular"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CBU / CVU</Label>
                    <Input
                      value={paymentMethods.transferCbu || ""}
                      onChange={(e) =>
                        setPaymentMethods((p) => ({
                          ...p,
                          transferCbu: e.target.value,
                        }))
                      }
                      placeholder="0000000000000000000000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Alias</Label>
                    <Input
                      value={paymentMethods.transferAlias || ""}
                      onChange={(e) =>
                        setPaymentMethods((p) => ({
                          ...p,
                          transferAlias: e.target.value,
                        }))
                      }
                      placeholder="mi.alias.transferencia"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notas adicionales</Label>
                  <Textarea
                    value={paymentMethods.transferNotes || ""}
                    onChange={(e) =>
                      setPaymentMethods((p) => ({
                        ...p,
                        transferNotes: e.target.value,
                      }))
                    }
                    placeholder="Ej: Enviar comprobante por WhatsApp"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <Button
            disabled={savingPayments}
            onClick={async () => {
              setSavingPayments(true);
              try {
                await update({ paymentMethods });
                toast.success("Metodos de pago guardados");
              } catch (err: any) {
                toast.error(err.message);
              } finally {
                setSavingPayments(false);
              }
            }}
          >
            {savingPayments ? "Guardando..." : "Guardar pagos"}
          </Button>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4 mt-4">
          <Link
            href="/billing"
            className="flex items-center justify-between rounded-xl border bg-white p-4 hover:bg-surface-container-low transition-colors"
          >
            <div className="flex items-center gap-3">
              <MaterialIcon
                name="workspace_premium"
                size="md"
                className="text-primary"
              />
              <div>
                <p className="font-bold text-sm">Plan y facturación</p>
                <p className="text-xs text-muted-foreground">
                  Estado del plan, límites, historial de cobros y gestion de la
                  suscripción
                </p>
              </div>
            </div>
            <MaterialIcon
              name="chevron_right"
              size="md"
              className="text-on-surface-variant"
            />
          </Link>
        </TabsContent>

        <TabsContent value="delivery" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Zonas de delivery</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="Nombre de zona"
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Precio"
                  value={newZonePrice}
                  onChange={(e) => setNewZonePrice(e.target.value)}
                  className="w-full sm:w-32"
                />
                <Button onClick={handleCreateZone}>
                  <MaterialIcon name="add" size="sm" className="mr-1" />
                  Agregar
                </Button>
              </div>
              {zones.map((zone) => (
                <div
                  key={zone.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <span className="font-medium">{zone.name}</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      ${zone.price.toLocaleString()}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteZone(zone.id)}
                  >
                    <MaterialIcon
                      name="delete"
                      size="sm"
                      className="text-destructive"
                    />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kitchen" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Acceso Cocina</CardTitle>
              <CardDescription>
                Creá links para que cocina vea los pedidos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleCreateToken}>
                <MaterialIcon name="add" size="sm" className="mr-1" />
                Crear acceso
              </Button>
              {tokens.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {t.name || `Vista ${tokens.indexOf(t) + 1}`}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      {getKitchenUrl(t.token)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyKitchenLink(t.token)}
                    >
                      <MaterialIcon name="content_copy" size="sm" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevokeToken(t.id)}
                    >
                      <MaterialIcon
                        name="delete"
                        size="sm"
                        className="text-destructive"
                      />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delivery-portal" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Acceso Delivery</CardTitle>
              <CardDescription>
                Crea links para que los repartidores vean pedidos listos para
                recoger
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleCreateDeliveryToken}>
                <MaterialIcon name="add" size="sm" className="mr-1" />
                Crear acceso
              </Button>
              {deliveryTokens.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {t.name || `Delivery ${deliveryTokens.indexOf(t) + 1}`}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      {getDeliveryUrl(t.token)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyDeliveryLink(t.token)}
                    >
                      <MaterialIcon name="content_copy" size="sm" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevokeDeliveryToken(t.id)}
                    >
                      <MaterialIcon
                        name="delete"
                        size="sm"
                        className="text-destructive"
                      />
                    </Button>
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
              <CardDescription>
                Configurá los horarios de apertura y cierre para cada día
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {hours.map((h, i) => (
                <div
                  key={h.dayOfWeek}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 rounded-md border p-3"
                >
                  <span className="font-medium">{DAY_NAMES[i]}</span>
                  <div className="flex items-center gap-3 sm:ml-auto">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={h.isClosed}
                        onCheckedChange={(checked) =>
                          setHours((prev) =>
                            prev.map((row, j) =>
                              j === i ? { ...row, isClosed: checked } : row,
                            ),
                          )
                        }
                      />
                      <Label className="text-sm text-muted-foreground">
                        Cerrado
                      </Label>
                    </div>
                    {!h.isClosed && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={h.opensAt}
                          className="w-28"
                          onChange={(e) =>
                            setHours((prev) =>
                              prev.map((row, j) =>
                                j === i
                                  ? { ...row, opensAt: e.target.value }
                                  : row,
                              ),
                            )
                          }
                        />
                        <span className="text-muted-foreground">a</span>
                        <Input
                          type="time"
                          value={h.closesAt}
                          className="w-28"
                          onChange={(e) =>
                            setHours((prev) =>
                              prev.map((row, j) =>
                                j === i
                                  ? { ...row, closesAt: e.target.value }
                                  : row,
                              ),
                            )
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <Button
                disabled={savingHours}
                onClick={async () => {
                  setSavingHours(true);
                  try {
                    await updateHours(hours);
                    toast.success("Horarios guardados");
                  } catch (err: any) {
                    toast.error(err.message);
                  } finally {
                    setSavingHours(false);
                  }
                }}
              >
                {savingHours ? "Guardando..." : "Guardar horarios"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Notificaciones</CardTitle>
              <CardDescription>
                Recibí un aviso en el celular cuando llegue un pedido nuevo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!pushSupported ? (
                <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
                  Tu navegador no soporta notificaciones push. Probá con Chrome
                  o Edge en el celular.
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">Notificaciones de pedidos</p>
                    <p className="text-sm text-muted-foreground">
                      {pushEnabled
                        ? "Vas a recibir un aviso cuando entre un pedido nuevo"
                        : "Activá para enterarte al instante cuando entra un pedido"}
                    </p>
                  </div>
                  <Switch
                    checked={pushEnabled}
                    disabled={pushBusy}
                    onCheckedChange={handleTogglePush}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
