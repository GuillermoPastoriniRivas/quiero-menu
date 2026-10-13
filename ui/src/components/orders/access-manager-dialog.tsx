'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { MaterialIcon } from '@/components/ui/material-icon';
import type { KitchenAccessToken, DeliveryAccessToken } from '@/types';
import { toast } from 'sonner';

interface AccessManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ScreenRow({
  name,
  url,
  onOpen,
  onCopy,
  onRemove,
}: {
  name: string;
  url: string;
  onOpen: () => void;
  onCopy: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-outline-variant/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-sm font-bold text-on-surface">{name}</p>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={onCopy}
            title="Copiar link"
            aria-label={`Copiar link de ${name}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-low"
          >
            <MaterialIcon name="content_copy" size="sm" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            title="Eliminar esta pantalla"
            aria-label={`Eliminar ${name}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-error-container/40 hover:text-error"
          >
            <MaterialIcon name="delete" size="sm" />
          </button>
        </div>
      </div>
      <p className="mt-1 truncate font-mono text-xs text-on-surface-variant">{url}</p>
      <Button size="sm" className="mt-2 w-full" onClick={onOpen}>
        <MaterialIcon name="open_in_new" size="sm" />
        Abrir en la pantalla
      </Button>
    </div>
  );
}

export function AccessManagerDialog({ open, onOpenChange }: AccessManagerDialogProps) {
  const [tokens, setTokens] = useState<KitchenAccessToken[]>([]);
  const [deliveryTokens, setDeliveryTokens] = useState<DeliveryAccessToken[]>([]);

  const loadTokens = async () => {
    try {
      setTokens(await api.get<KitchenAccessToken[]>('/kitchen/tokens'));
    } catch {
      toast.error('No se pudieron cargar las pantallas de cocina');
    }
  };

  const loadDeliveryTokens = async () => {
    try {
      setDeliveryTokens(await api.get<DeliveryAccessToken[]>('/delivery/tokens'));
    } catch {
      toast.error('No se pudieron cargar las pantallas de delivery');
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
        if (!cancelled) toast.error('No se pudieron cargar las pantallas de cocina');
      }
    };

    const fetchDelivery = async () => {
      try {
        const data = await api.get<DeliveryAccessToken[]>('/delivery/tokens');
        if (!cancelled) setDeliveryTokens(data);
      } catch {
        if (!cancelled) toast.error('No se pudieron cargar las pantallas de delivery');
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
      const name = `Cocina ${tokens.length + 1}`;
      await api.post('/kitchen/tokens', { name });
      loadTokens();
      toast.success('Pantalla de cocina creada');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al crear la pantalla');
    }
  };

  const handleRevokeToken = async (id: string) => {
    try {
      await api.delete(`/kitchen/tokens/${id}`);
      loadTokens();
      toast.success('Pantalla eliminada');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al eliminar la pantalla');
    }
  };

  const getKitchenUrl = (token: string) => `${window.location.origin}/kitchen/${token}`;

  const copyKitchenLink = (token: string) => {
    navigator.clipboard.writeText(getKitchenUrl(token));
    toast.success('Link copiado');
  };

  const handleCreateDeliveryToken = async () => {
    try {
      const name = `Delivery ${deliveryTokens.length + 1}`;
      await api.post('/delivery/tokens', { name });
      loadDeliveryTokens();
      toast.success('Pantalla de delivery creada');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al crear la pantalla');
    }
  };

  const handleRevokeDeliveryToken = async (id: string) => {
    try {
      await api.delete(`/delivery/tokens/${id}`);
      loadDeliveryTokens();
      toast.success('Pantalla eliminada');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al eliminar la pantalla');
    }
  };

  const getDeliveryUrl = (token: string) => `${window.location.origin}/delivery/${token}`;

  const copyDeliveryLink = (token: string) => {
    navigator.clipboard.writeText(getDeliveryUrl(token));
    toast.success('Link copiado');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-md sm:max-w-lg max-h-[85vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>Pantallas del equipo</DialogTitle>
          <DialogDescription>
            Son links para abrir en las pantallas del local (la tablet de la cocina, el celular del
            repartidor). No hace falta usuario ni contraseña: quien tenga el link ve los pedidos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2 min-w-0">
          {/* Cocina */}
          <section className="space-y-3 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-3 min-w-0">
              <div className="flex min-w-0 items-start gap-2">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <MaterialIcon name="restaurant" size="sm" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-on-surface">Pantalla de Cocina</p>
                  <p className="text-xs text-on-surface-variant">
                    Muestra los pedidos nuevos y los que están en preparación.
                  </p>
                </div>
              </div>
              <Button size="sm" onClick={handleCreateToken} className="shrink-0">
                <MaterialIcon name="add" size="sm" className="mr-1" />
                {tokens.length === 0 ? 'Crear pantalla' : 'Crear otra'}
              </Button>
            </div>
            {tokens.length === 0 ? (
              <p className="rounded-xl bg-surface-container-low px-3 py-3 text-xs text-on-surface-variant">
                Todavía no hay ninguna. Creá una y abrilo en la tablet de la cocina; dejala abierta.
              </p>
            ) : (
              <div className="space-y-2 min-w-0">
                {tokens.map((t, i) => (
                  <ScreenRow
                    key={t.id}
                    name={t.name || `Cocina ${i + 1}`}
                    url={getKitchenUrl(t.token)}
                    onOpen={() => window.open(getKitchenUrl(t.token), '_blank')}
                    onCopy={() => copyKitchenLink(t.token)}
                    onRemove={() => handleRevokeToken(t.id)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Delivery */}
          <section className="space-y-3 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-3 min-w-0">
              <div className="flex min-w-0 items-start gap-2">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <MaterialIcon name="delivery_dining" size="sm" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-on-surface">Pantalla de Delivery</p>
                  <p className="text-xs text-on-surface-variant">
                    Muestra los pedidos listos para entregar o en camino.
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={handleCreateDeliveryToken} className="shrink-0">
                <MaterialIcon name="add" size="sm" className="mr-1" />
                {deliveryTokens.length === 0 ? 'Crear pantalla' : 'Crear otra'}
              </Button>
            </div>
            {deliveryTokens.length === 0 ? (
              <p className="rounded-xl bg-surface-container-low px-3 py-3 text-xs text-on-surface-variant">
                Todavía no hay ninguna. Creá una y abrilo en el celular del repartidor.
              </p>
            ) : (
              <div className="space-y-2 min-w-0">
                {deliveryTokens.map((t, i) => (
                  <ScreenRow
                    key={t.id}
                    name={t.name || `Delivery ${i + 1}`}
                    url={getDeliveryUrl(t.token)}
                    onOpen={() => window.open(getDeliveryUrl(t.token), '_blank')}
                    onCopy={() => copyDeliveryLink(t.token)}
                    onRemove={() => handleRevokeDeliveryToken(t.id)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
