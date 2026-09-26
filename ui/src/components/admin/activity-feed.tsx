import Link from "next/link";
import { MaterialIcon } from "@/components/ui/material-icon";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AdminActivityEntry } from "@/types";

const EVENTS: Record<string, { icon: string; label: string; tone?: "good" | "bad" }> = {
  "auth.signup": { icon: "person", label: "Se registró con email", tone: "good" },
  "auth.google": { icon: "login", label: "Entró con Google" },
  "auth.login": { icon: "login", label: "Inició sesión" },
  "auth.logout": { icon: "logout", label: "Cerró sesión" },
  "auth.email_verified": { icon: "verified", label: "Verificó su email", tone: "good" },
  "auth.password_reset": { icon: "key", label: "Cambió la contraseña con el link del email" },
  "auth.password_set": { icon: "key", label: "Creó o cambió su contraseña" },
  "auth.resend_verification": { icon: "mark_email_read", label: "Pidió reenviar la verificación" },
  "account.deleted": { icon: "delete_forever", label: "Borró su cuenta", tone: "bad" },
  "billing.checkout": { icon: "workspace_premium", label: "Empezó el pago de Pro", tone: "good" },
  "billing.cancel": { icon: "cancel", label: "Canceló el plan Pro", tone: "bad" },
  "invitation.accepted": { icon: "handshake", label: "Aceptó la invitación y tomó el local", tone: "good" },
  "admin.claim_approved": { icon: "check_circle", label: "Aprobó un reclamo y mandó la invitación", tone: "good" },
  "admin.claim_rejected": { icon: "block", label: "Rechazó un reclamo" },
  "admin.featured_assigned": { icon: "star", label: "Destacó el local" },
  "admin.featured_deactivated": { icon: "star", label: "Sacó un destacado" },
  "admin.impersonated": { icon: "swap_horiz", label: "Entró como el dueño" },
  "admin.invitation_created": { icon: "link", label: "Generó una invitación" },
  "admin.invitation_revoked": { icon: "link_off", label: "Canceló una invitación" },
  "admin.operate_started": { icon: "edit", label: "Abrió el local en modo edición" },
  "admin.operate_write": { icon: "edit_note", label: "Editó el local" },
  "admin.restaurant_created": { icon: "add_circle", label: "Creó una cuenta de local" },
  "admin.restaurant_unclaimed_created": { icon: "add_circle", label: "Cargó una ficha nueva", tone: "good" },
  "admin.restaurant_updated": { icon: "edit", label: "Editó los datos de la ficha" },
  "restaurant.updated": { icon: "storefront", label: "Actualizó los datos del local" },
  "order.updated": { icon: "receipt_long", label: "Cambió el estado de un pedido" },
};

function describe(entry: AdminActivityEntry): { icon: string; label: string; tone?: "good" | "bad" } {
  const known = EVENTS[entry.event];
  const base = known ?? { icon: "history", label: entry.event };
  if (entry.event === "admin.operate_write" && entry.count > 1) {
    return { ...base, label: `Editó el local (${entry.count} cambios)` };
  }
  if (entry.count > 1) return { ...base, label: `${base.label} (${entry.count} veces)` };
  return base;
}

export function ActivityFeed({
  entries,
  showRestaurant = false,
}: {
  entries: AdminActivityEntry[];
  showRestaurant?: boolean;
}) {
  if (entries.length === 0) {
    return <p className="py-6 text-center text-sm text-on-surface-variant">Todavía no hay actividad.</p>;
  }
  return (
    <ol className="relative space-y-3 before:absolute before:bottom-2 before:left-[15px] before:top-2 before:w-px before:bg-outline-variant/40">
      {entries.map((entry) => {
        const info = describe(entry);
        const actor = entry.actor?.name || entry.actor?.email;
        return (
          <li key={entry.id} className="relative flex gap-3">
            <span
              className={cn(
                "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-surface-container-lowest",
                info.tone === "good" && "bg-success-container text-success",
                info.tone === "bad" && "bg-error-container text-error",
                !info.tone && "bg-surface-container-high text-on-surface-variant",
              )}
            >
              <MaterialIcon name={info.icon} size="xs" />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm text-on-surface">
                {actor && <span className="font-semibold">{actor} · </span>}
                {info.label}
                {showRestaurant && entry.restaurant && (
                  <>
                    {" en "}
                    <Link href={`/admin/locales/${entry.restaurant.id}`} className="font-semibold text-primary hover:underline">
                      {entry.restaurant.name}
                    </Link>
                  </>
                )}
              </p>
              <p className="text-xs text-on-surface-variant">{formatRelativeTime(entry.createdAt)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
