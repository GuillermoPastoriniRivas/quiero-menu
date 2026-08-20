"use client";

import { useState } from "react";
import { useRestaurantStore } from "@/stores/restaurant.store";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

/**
 * Badge global del panel: muestra Abierto/Cerrado en tiempo real (el horario
 * actúa como switch automático) y permite un override manual con el toggle.
 * - El toggle refleja el estado efectivo: ON = abierto, OFF = cerrado.
 * - Si el horario ya da el estado elegido, vuelve a "auto"; si no, fuerza el
 *   override (abierto o cerrado) hasta que se vuelva a tocar.
 */
export function OpenStatusBadge({ compact = false }: { compact?: boolean }) {
  const restaurant = useRestaurantStore((s) => s.restaurant);
  const isOpen = useRestaurantStore((s) => s.isOpen);
  const todayHours = useRestaurantStore((s) => s.todayHours);
  const closesAtLabel = useRestaurantStore((s) => s.closesAtLabel);
  const setOpenStatus = useRestaurantStore((s) => s.setOpenStatus);
  const [busy, setBusy] = useState(false);

  if (!restaurant) return null;

  const override = restaurant.openOverride; // 'open' | 'closed' | null
  const checked = isOpen;

  const handleToggle = async (on: boolean) => {
    setBusy(true);
    try {
      await setOpenStatus(on);
      toast.success(
        on
          ? "Local abierto. El menú recibe pedidos."
          : "Local cerrado. El menú no recibe pedidos.",
      );
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Error al cambiar el estado",
      );
    } finally {
      setBusy(false);
    }
  };

  let label: string;
  let dot: string;
  if (override === "open") {
    label = "Abierto (manual)";
    dot = "bg-green-500";
  } else if (override === "closed") {
    label = "Cerrado (manual)";
    dot = "bg-red-500";
  } else if (isOpen) {
    label = "Abierto";
    dot = "bg-green-500";
  } else {
    label = "Cerrado";
    dot = "bg-gray-400";
  }

  let sub: string | null = null;
  if (override === "open") {
    sub = "Abierto manualmente, ignorando el horario";
  } else if (override === "closed") {
    sub = "Cerrado manualmente, ignorando el horario";
  } else if (isOpen && closesAtLabel) {
    sub = `Cierra a las ${closesAtLabel}`;
  } else if (!isOpen && todayHours) {
    sub = todayHours.isClosed
      ? "Cerrado hoy"
      : `Horario hoy: ${todayHours.opensAt} – ${todayHours.closesAt}`;
  } else if (!isOpen) {
    sub = "Sin horario configurado";
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-outline-variant/20 bg-white px-3 py-1.5">
        <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
        <span className="text-xs font-bold max-w-[9rem] truncate">{label}</span>
        <Switch
          checked={checked}
          disabled={busy}
          onCheckedChange={handleToggle}
          className="scale-90"
        />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-outline-variant/20 bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
          <span className="text-sm font-bold truncate">{label}</span>
        </div>
        <Switch
          checked={checked}
          disabled={busy}
          onCheckedChange={handleToggle}
        />
      </div>
      {sub && <p className="mt-1 text-xs text-on-surface-variant">{sub}</p>}
    </div>
  );
}
