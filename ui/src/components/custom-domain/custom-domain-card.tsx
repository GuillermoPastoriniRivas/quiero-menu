"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MaterialIcon } from "@/components/ui/material-icon";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  CustomDomainInfo,
  CustomDomainState,
} from "@/types";

const STATUS_META: Record<
  CustomDomainState,
  { label: string; className: string; icon: string; spin?: boolean }
> = {
  pending: {
    label: "Pendiente",
    className: "bg-yellow-100 text-yellow-700",
    icon: "schedule",
  },
  provisioning: {
    label: "Activando...",
    className: "bg-blue-100 text-blue-700",
    icon: "progress_activity",
    spin: true,
  },
  active: {
    label: "Activo",
    className: "bg-green-100 text-green-700",
    icon: "check_circle",
  },
  failed: {
    label: "Falló",
    className: "bg-red-100 text-red-700",
    icon: "error",
  },
};

export function CustomDomainCard({ isPro }: { isPro: boolean }) {
  const [info, setInfo] = useState<CustomDomainInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [domainInput, setDomainInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await api.get<CustomDomainInfo>(
        "/restaurants/current/custom-domain",
      );
      setInfo(data);
    } catch {
      setInfo(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const state = info?.status?.state;

  useEffect(() => {
    if (!state || state === "active" || state === "failed") return;
    const t = setInterval(fetchStatus, 8000);
    return () => clearInterval(t);
  }, [state, fetchStatus]);

  const handleSave = async () => {
    const domain = domainInput.trim();
    if (!domain) return;
    setSaving(true);
    try {
      await api.put<CustomDomainInfo>("/restaurants/current/custom-domain", {
        domain,
      });
      toast.success("Dominio guardado. Configurá el DNS para activarlo.");
      setDomainInput("");
      await fetchStatus();
    } catch (err) {
      toast.error((err as Error)?.message || "Error al guardar el dominio");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (
      !confirm("¿Querés dejar de usar este dominio personalizado?")
    )
      return;
    setRemoving(true);
    try {
      await api.delete("/restaurants/current/custom-domain");
      toast.success("Dominio eliminado");
      setInfo(null);
    } catch (err) {
      toast.error((err as Error)?.message || "Error al eliminar el dominio");
    } finally {
      setRemoving(false);
    }
  };

  if (!isPro) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MaterialIcon name="language" size="sm" className="text-primary" />
            Dominio personalizado
          </CardTitle>
          <CardDescription>Exclusivo del plan Pro</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-sm">
            <p className="font-bold mb-1">Tu menú en tu dominio</p>
            <p className="text-muted-foreground">
              Con el plan Pro podés servir tu storefront en tu propio dominio
              (ej: <span className="font-mono">menu.mirestaurante.com</span>)
              en lugar de <span className="font-mono">quiero.menu/tu-local</span>.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MaterialIcon name="language" size="sm" className="text-primary" />
          Dominio personalizado
        </CardTitle>
        <CardDescription>Serví tu storefront en tu propio dominio</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && info === null ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : info?.domain ? (
          <>
            <div className="flex items-center justify-between gap-3 rounded-xl border p-4">
              <div className="min-w-0">
                <p className="font-mono font-semibold text-sm truncate">
                  {info.domain}
                </p>
                {state && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold mt-1.5",
                      STATUS_META[state].className,
                    )}
                  >
                    <MaterialIcon
                      name={STATUS_META[state].icon}
                      size="xs"
                      className={STATUS_META[state].spin ? "animate-spin" : ""}
                    />
                    {STATUS_META[state].label}
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                className="text-destructive"
                size="sm"
                disabled={removing}
                onClick={handleRemove}
              >
                {removing ? "Quitando..." : "Quitar"}
              </Button>
            </div>

            {state === "pending" && (
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800 space-y-1">
                <p className="font-bold">Falta configurar el DNS</p>
                <p>
                  Apuntá tu dominio a nuestro servidor para que se active
                  automáticamente:
                </p>
                <p className="font-mono text-xs">
                  CNAME <b>{info.domain}</b> → <b>quiero.menu</b>
                </p>
                <p className="font-mono text-xs">
                  o registro A → la IP de quiero.menu
                </p>
                <p className="text-xs">
                  Se activa solo en pocos minutos cuando el DNS resuelva.
                </p>
              </div>
            )}

            {state === "failed" && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-800">
                <p className="font-bold">No se pudo activar</p>
                {info.status?.failedReason && (
                  <p className="text-xs mt-1">{info.status.failedReason}</p>
                )}
                <p className="text-xs mt-1">
                  Verificá que el DNS apunte a nosotros y guardá el dominio de
                  nuevo.
                </p>
              </div>
            )}

            {state === "active" && (
              <p className="text-xs text-muted-foreground">
                Tu storefront ya está disponible en{" "}
                <a
                  href={`https://${info.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-primary underline"
                >
                  {info.domain}
                </a>
              </p>
            )}
          </>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="menu.mirestaurante.com"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                className="font-mono"
              />
              <Button
                disabled={saving || !domainInput.trim()}
                onClick={handleSave}
                className="shrink-0"
              >
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Después vas a tener que apuntar el DNS de tu dominio hacia
              quiero.menu para que se active.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
