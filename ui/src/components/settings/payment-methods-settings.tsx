"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRestaurantStore } from "@/stores/restaurant.store";
import { useActivationStore } from "@/stores/activation.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MaterialIcon } from "@/components/ui/material-icon";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { PaymentMethodsConfig } from "@/types";

const METHODS: { key: "cashEnabled" | "cardEnabled" | "transferEnabled"; title: string; text: string; icon: string }[] = [
  { key: "cashEnabled", title: "Efectivo", text: "Te paga al recibir o al retirar el pedido.", icon: "payments" },
  { key: "cardEnabled", title: "Tarjeta", text: "Con posnet al recibir o al retirar.", icon: "account_balance" },
  {
    key: "transferEnabled",
    title: "Transferencia",
    text: "Te transfiere antes y te manda el comprobante desde el seguimiento del pedido.",
    icon: "swap_horiz",
  },
];

export function PaymentMethodsSettings() {
  const { restaurant, fetch: fetchRestaurant, update } = useRestaurantStore();
  const refreshActivation = useActivationStore((s) => s.fetch);
  const [methods, setMethods] = useState<PaymentMethodsConfig>({
    cashEnabled: true,
    cardEnabled: false,
    transferEnabled: false,
  });
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRestaurant();
  }, [fetchRestaurant]);

  useEffect(() => {
    if (restaurant?.paymentMethods) setMethods(restaurant.paymentMethods);
  }, [restaurant]);

  const set = (patch: Partial<PaymentMethodsConfig>) => setMethods((m) => ({ ...m, ...patch }));
  const noneEnabled = !methods.cashEnabled && !methods.cardEnabled && !methods.transferEnabled;
  const transferIncomplete =
    methods.transferEnabled && !methods.transferAlias?.trim() && !methods.transferCbu?.trim();

  const handleSave = async () => {
    if (noneEnabled) {
      toast.error("Activá al menos un medio de cobro.");
      return;
    }
    setSaving(true);
    try {
      await update({ paymentMethods: methods });
      refreshActivation();
      toast.success(
        transferIncomplete
          ? "Guardado. Acordate de cargar el alias o CBU para la transferencia."
          : "Medios de cobro guardados",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudieron guardar los medios de cobro");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Cómo te pagan</CardTitle>
          <CardDescription>
            Elegí los medios que aceptás. El cliente elige uno al hacer el pedido.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-outline-variant/20">
          {METHODS.map((m) => (
            <label key={m.key} className="flex cursor-pointer items-center gap-4 py-4 first:pt-0 last:pb-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container-low text-on-surface-variant">
                <MaterialIcon name={m.icon} size="md" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-on-surface">{m.title}</span>
                <span className="block text-sm text-on-surface-variant">{m.text}</span>
              </span>
              <Switch checked={Boolean(methods[m.key])} onCheckedChange={(checked) => set({ [m.key]: checked })} />
            </label>
          ))}
          {noneEnabled && (
            <p className="flex items-center gap-2 pt-4 text-sm font-semibold text-error">
              <MaterialIcon name="error" size="sm" />
              Sin ningún medio activo nadie puede terminar un pedido.
            </p>
          )}
        </CardContent>
      </Card>

      {methods.transferEnabled && (
        <Card className={transferIncomplete ? "ring-2 ring-amber-300" : undefined}>
          <CardHeader>
            <CardTitle>Datos para la transferencia</CardTitle>
            <CardDescription>
              Se muestran cuando el cliente elige transferir. Con el alias alcanza.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {transferIncomplete && (
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <MaterialIcon name="warning" size="sm" className="mt-0.5 shrink-0" />
                <span>
                  Tenés la transferencia activa sin alias ni CBU: el cliente no va a saber a dónde pagar.
                  Cargá uno de los dos o desactivá la transferencia.
                </span>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="transfer-alias">Alias</Label>
                <Input
                  id="transfer-alias"
                  value={methods.transferAlias || ""}
                  onChange={(e) => set({ transferAlias: e.target.value })}
                  placeholder="mi.local.mp"
                  autoCapitalize="none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transfer-cbu">CBU o CVU</Label>
                <Input
                  id="transfer-cbu"
                  value={methods.transferCbu || ""}
                  onChange={(e) => set({ transferCbu: e.target.value.replace(/[^\d]/g, "").slice(0, 22) })}
                  placeholder="22 dígitos"
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="transfer-holder">Titular</Label>
                <Input
                  id="transfer-holder"
                  value={methods.transferAccountHolder || ""}
                  onChange={(e) => set({ transferAccountHolder: e.target.value })}
                  placeholder="A nombre de quién está la cuenta"
                />
              </div>
            </div>

            {showBankDetails ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="transfer-bank">Banco o billetera</Label>
                  <Input
                    id="transfer-bank"
                    value={methods.transferBankName || ""}
                    onChange={(e) => set({ transferBankName: e.target.value })}
                    placeholder="Mercado Pago, Banco Nación..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transfer-type">Tipo de cuenta</Label>
                  <Input
                    id="transfer-type"
                    value={methods.transferAccountType || ""}
                    onChange={(e) => set({ transferAccountType: e.target.value })}
                    placeholder="Caja de ahorro"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="transfer-number">Número de cuenta</Label>
                  <Input
                    id="transfer-number"
                    value={methods.transferAccountNumber || ""}
                    onChange={(e) => set({ transferAccountNumber: e.target.value })}
                  />
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowBankDetails(true)}
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                <MaterialIcon name="add" size="sm" />
                Agregar banco y número de cuenta
              </button>
            )}

            <div className="space-y-2">
              <Label htmlFor="transfer-notes">Indicaciones para el cliente</Label>
              <Textarea
                id="transfer-notes"
                value={methods.transferNotes || ""}
                onChange={(e) => set({ transferNotes: e.target.value })}
                placeholder="Ej: mandá el comprobante antes de que salga el pedido"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Button disabled={saving} onClick={handleSave} size="lg" className="w-full sm:w-auto">
        {saving ? "Guardando..." : "Guardar medios de cobro"}
      </Button>
    </div>
  );
}
