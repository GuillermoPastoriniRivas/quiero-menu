"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Switch } from "@/components/ui/switch";
import { MaterialIcon } from "@/components/ui/material-icon";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import type { NotificationPreferences } from "@/types";
import {
  subscribeStaffPush,
  unsubscribePush,
  isPushSupported,
  isPushSubscribed,
} from "@/lib/push";

function Row({
  icon,
  title,
  description,
  checked,
  onToggle,
  disabled,
  alwaysOn,
}: {
  icon: string;
  title: string;
  description: string;
  checked?: boolean;
  onToggle?: () => void;
  disabled?: boolean;
  alwaysOn?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-container-low text-on-surface-variant">
          <MaterialIcon name={icon} size="sm" />
        </span>
        <div className="min-w-0">
          <p className="font-medium text-on-surface">{title}</p>
          <p className="text-sm text-on-surface-variant">{description}</p>
        </div>
      </div>
      {alwaysOn ? (
        <span className="shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600">
          Siempre activo
        </span>
      ) : (
        <Switch
          checked={!!checked}
          onCheckedChange={onToggle ? () => onToggle() : undefined}
          disabled={disabled}
        />
      )}
    </div>
  );
}

export function NotificationsSettings() {
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<"email" | null>(null);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<NotificationPreferences>(
          "/notifications/preferences",
        );
        setPrefs(data);
      } catch {
        toast.error("No se pudieron cargar las notificaciones");
      } finally {
        setLoading(false);
      }
      const supported = await isPushSupported();
      setPushSupported(supported);
      if (supported) setPushEnabled(await isPushSubscribed());
    })();
  }, []);

  const save = async (
    patch: Partial<Pick<NotificationPreferences, "notifyEmail">>,
    which: "email",
  ) => {
    setSaving(which);
    try {
      const data = await api.patch<NotificationPreferences>(
        "/notifications/preferences",
        patch,
      );
      setPrefs(data);
      toast.success("Preferencias guardadas");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "No se pudieron guardar las preferencias",
      );
    } finally {
      setSaving(null);
    }
  };

  const togglePush = async () => {
    setPushBusy(true);
    try {
      if (!pushEnabled) {
        const token = api.getAccessToken();
        if (!token) return;
        const ok = await subscribeStaffPush(token);
        if (!ok) {
          toast.error("No se pudo activar. Revisá los permisos del navegador.");
          return;
        }
        setPushEnabled(true);
        toast.success("Avisos del navegador activados");
      } else {
        await unsubscribePush();
        setPushEnabled(false);
        toast.success("Avisos del navegador desactivados");
      }
    } catch {
      toast.error("Error al cambiar los avisos del navegador");
    } finally {
      setPushBusy(false);
    }
  };

  const notifyEmail = prefs?.notifyEmail ?? true;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alertas de pedidos nuevos</CardTitle>
        <CardDescription>
          Elegí por dónde te avisamos cuando entra un pedido. Los avisos en la
          app están siempre activos.
        </CardDescription>
      </CardHeader>
      <CardContent className="divide-y divide-outline-variant/10">
        <Row
          icon="notifications"
          title="En la app"
          description="El pedido aparece en tu panel en tiempo real, siempre activo."
          alwaysOn
        />
        <Row
          icon="devices"
          title="En la compu y el celular"
          description={
            pushSupported
              ? "Aviso del navegador aunque tengas el panel cerrado."
              : "Tu navegador no permite avisos del sistema."
          }
          checked={pushEnabled}
          onToggle={pushSupported ? togglePush : undefined}
          disabled={!pushSupported || pushBusy || loading}
        />
        <Row
          icon="mail"
          title="Por email"
          description="Te mandamos un email a tu casilla cuando entra un pedido."
          checked={notifyEmail}
          onToggle={() => save({ notifyEmail: !notifyEmail }, "email")}
          disabled={loading || saving === "email"}
        />
      </CardContent>
    </Card>
  );
}
