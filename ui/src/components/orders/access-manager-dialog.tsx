'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MaterialIcon } from '@/components/ui/material-icon';
import type { KitchenAccessToken, DeliveryAccessToken } from '@/types';
import { toast } from 'sonner';

interface AccessManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccessManagerDialog({ open, onOpenChange }: AccessManagerDialogProps) {
  const [tokens, setTokens] = useState<KitchenAccessToken[]>([]);
  const [deliveryTokens, setDeliveryTokens] = useState<DeliveryAccessToken[]>([]);

  const loadTokens = async () => {
    try {
      const data = await api.get<KitchenAccessToken[]>('/kitchen/tokens');
      setTokens(data);
    } catch {
      toast.error('No se pudieron cargar los accesos de cocina');
    }
  };

  const loadDeliveryTokens = async () => {
    try {
      const data = await api.get<DeliveryAccessToken[]>('/delivery/tokens');
      setDeliveryTokens(data);
    } catch {
      toast.error('No se pudieron cargar los accesos de delivery');
    }
  };

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const fetchKitchen = async () => {
      try {
        const data = await api.get<KitchenAccessToken[]>('/kitchen/tokens');
        if (!cancelled) setTokens(data);
      } catch {
        if (!cancelled) toast.error('No se pudieron cargar los accesos de cocina');
      }
    };

    const fetchDelivery = async () => {
      try {
        const data = await api.get<DeliveryAccessToken[]>('/delivery/tokens');
        if (!cancelled) setDeliveryTokens(data);
      } catch {
        if (!cancelled) toast.error('No se pudieron cargar los accesos de delivery');
      }
    };

    fetchKitchen();
    fetchDelivery();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleCreateToken = async () => {
    try {
      const name = `Vista ${tokens.length + 1}`;
      await api.post('/kitchen/tokens', { name });
      loadTokens();
      toast.success('Acceso creado');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al crear el acceso');
    }
  };

  const handleRevokeToken = async (id: string) => {
    try {
      await api.delete(`/kitchen/tokens/${id}`);
      loadTokens();
      toast.success('Acceso eliminado');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al eliminar el acceso');
    }
  };

  const getKitchenUrl = (token: string) =>
    `${window.location.origin}/kitchen/${token}`;

  const copyKitchenLink = (token: string) => {
    navigator.clipboard.writeText(getKitchenUrl(token));
    toast.success('Link copiado');
  };

  const handleCreateDeliveryToken = async () => {
    try {
      const name = `Delivery ${deliveryTokens.length + 1}`;
      await api.post('/delivery/tokens', { name });
      loadDeliveryTokens();
      toast.success('Acceso delivery creado');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al crear el acceso');
    }
  };

  const handleRevokeDeliveryToken = async (id: string) => {
    try {
      await api.delete(`/delivery/tokens/${id}`);
      loadDeliveryTokens();
      toast.success('Acceso delivery eliminado');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al eliminar el acceso');
    }
  };

  const getDeliveryUrl = (token: string) =>
    `${window.location.origin}/delivery/${token}`;

  const copyDeliveryLink = (token: string) => {
    navigator.clipboard.writeText(getDeliveryUrl(token));
    toast.success('Link copiado');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Accesos del equipo</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Cocina */}
          <section className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-sm">Acceso Cocina</p>
                <p className="text-xs text-muted-foreground">
                  Links para que cocina vea los pedidos en pantalla
                </p>
              </div>
              <Button size="sm" onClick={handleCreateToken} className="shrink-0">
                <MaterialIcon name="add" size="sm" className="mr-1" />
                Crear
              </Button>
            </div>
            {tokens.length === 0 ? (
              <p className="text-xs text-muted-foreground px-1 py-2 rounded-lg bg-surface-container-low">
                Todavía no hay accesos de cocina.
              </p>
            ) : (
              <div className="space-y-2">
                {tokens.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-2 rounded-lg border p-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {t.name || `Vista ${tokens.indexOf(t) + 1}`}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {getKitchenUrl(t.token)}
                      </p>
                    </div>
                    <div className="flex gap-0.5 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(getKitchenUrl(t.token), '_blank')}
                        title="Abrir cocina"
                      >
                        <MaterialIcon name="open_in_new" size="sm" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyKitchenLink(t.token)}
                        title="Copiar link"
                      >
                        <MaterialIcon name="content_copy" size="sm" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeToken(t.id)}
                        title="Eliminar acceso"
                      >
                        <MaterialIcon name="delete" size="sm" className="text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Delivery */}
          <section className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-sm">Acceso Delivery</p>
                <p className="text-xs text-muted-foreground">
                  Links para que los repartidores vean pedidos listos para recoger
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={handleCreateDeliveryToken} className="shrink-0">
                <MaterialIcon name="add" size="sm" className="mr-1" />
                Crear
              </Button>
            </div>
            {deliveryTokens.length === 0 ? (
              <p className="text-xs text-muted-foreground px-1 py-2 rounded-lg bg-surface-container-low">
                Todavía no hay accesos de delivery.
              </p>
            ) : (
              <div className="space-y-2">
                {deliveryTokens.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-2 rounded-lg border p-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {t.name || `Delivery ${deliveryTokens.indexOf(t) + 1}`}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {getDeliveryUrl(t.token)}
                      </p>
                    </div>
                    <div className="flex gap-0.5 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(getDeliveryUrl(t.token), '_blank')}
                        title="Abrir delivery"
                      >
                        <MaterialIcon name="open_in_new" size="sm" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyDeliveryLink(t.token)}
                        title="Copiar link"
                      >
                        <MaterialIcon name="content_copy" size="sm" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeDeliveryToken(t.id)}
                        title="Eliminar acceso"
                      >
                        <MaterialIcon name="delete" size="sm" className="text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
