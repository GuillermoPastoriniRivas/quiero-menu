"use client";

import { useEffect, useState } from "react";
import { useRestaurantStore } from "@/stores/restaurant.store";
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
import { Switch } from "@/components/ui/switch";
import type { PaymentMethodsConfig } from "@/types";
import { toast } from "sonner";

export default function BusinessPaymentsPage() {
  const { restaurant, fetch: fetchRestaurant, update } = useRestaurantStore();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodsConfig>({
    cashEnabled: true,
    cardEnabled: true,
    transferEnabled: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRestaurant();
  }, [fetchRestaurant]);

  useEffect(() => {
    if (restaurant?.paymentMethods) {
      setPaymentMethods(restaurant.paymentMethods);
    }
  }, [restaurant]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await update({ paymentMethods });
      toast.success("Metodos de pago guardados");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Error al guardar los pagos",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pagos</h1>

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
        disabled={saving}
        onClick={handleSave}
      >
        {saving ? "Guardando..." : "Guardar pagos"}
      </Button>
    </div>
  );
}