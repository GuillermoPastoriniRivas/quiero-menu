"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
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
  KitchenAccessToken,
  DeliveryAccessToken,
} from "@/types";
import { toast } from "sonner";
import { MaterialIcon } from "@/components/ui/material-icon";
import {
  subscribeStaffPush,
  unsubscribePush,
  isPushSupported,
  isPushSubscribed,
} from "@/lib/push";

export default function AccountPage() {
  return (
    <Suspense fallback={null}>
      <AccountPageInner />
    </Suspense>
  );
}

function AccountPageInner() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>(
    searchParams.get("tab") ?? "notifications",
  );

  // Notifications (web push)
  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);

  // Kitchen tokens
  const [tokens, setTokens] = useState<KitchenAccessToken[]>([]);

  // Delivery tokens
  const [deliveryTokens, setDeliveryTokens] = useState<DeliveryAccessToken[]>(
    [],
  );

  useEffect(() => {
    (async () => {
      const supported = await isPushSupported();
      setPushSupported(supported);
      if (supported) setPushEnabled(await isPushSubscribed());
    })();
  }, []);

  useEffect(() => {
    loadTokens();
    loadDeliveryTokens();
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

  const loadTokens = async () => {
    const data = await api.get<KitchenAccessToken[]>("/kitchen/tokens");
    setTokens(data);
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
      <h1 className="text-2xl font-bold">Cuenta</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto overflow-y-hidden -mx-1 px-1">
          <TabsList>
            <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
            <TabsTrigger value="access">Accesos</TabsTrigger>
          </TabsList>
        </div>

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

        <TabsContent value="access" className="space-y-4 mt-4">
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
                      onClick={() => window.open(getKitchenUrl(t.token), "_blank")}
                      title="Abrir cocina"
                    >
                      <MaterialIcon name="open_in_new" size="sm" />
                    </Button>
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
                      onClick={() => window.open(getDeliveryUrl(t.token), "_blank")}
                      title="Abrir delivery"
                    >
                      <MaterialIcon name="open_in_new" size="sm" />
                    </Button>
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
      </Tabs>
    </div>
  );
}