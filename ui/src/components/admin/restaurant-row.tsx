import Link from "next/link";
import { MaterialIcon } from "@/components/ui/material-icon";
import { Photo } from "@/components/ui/photo";
import { ReadinessBar, StageBadge, expiryLabel } from "@/components/admin/stage";
import { READINESS_STEPS } from "@/lib/readiness";
import { getCategoryDef } from "@/lib/restaurant-categories";
import { cn } from "@/lib/utils";
import type { AdminRestaurantListItem } from "@/types";

export function RestaurantAvatar({
  name,
  logoUrl,
  size = "md",
}: {
  name: string;
  logoUrl?: string;
  size?: "sm" | "md" | "lg";
}) {
  const box = size === "lg" ? "h-16 w-16 rounded-2xl text-xl" : size === "sm" ? "h-8 w-8 rounded-lg text-xs" : "h-11 w-11 rounded-xl text-sm";
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  return (
    <span className={cn("relative flex shrink-0 items-center justify-center overflow-hidden bg-primary/10 font-extrabold text-primary", box)}>
      {logoUrl ? <Photo src={logoUrl} alt="" sizes="64px" /> : initials || "?"}
    </span>
  );
}

function Metric({ icon, value, title }: { icon: string; value: number; title: string }) {
  return (
    <span title={title} className={cn("inline-flex items-center gap-1 tabular-nums", value === 0 && "text-outline")}>
      <MaterialIcon name={icon} size="xs" />
      {value}
    </span>
  );
}

const ACTIVATION_KEYS = READINESS_STEPS.map((s) => s.key);

export function RestaurantRow({ item, dense = false }: { item: AdminRestaurantListItem; dense?: boolean }) {
  const category = item.category ? getCategoryDef(item.category)?.label : null;
  const owned = item.stage === "activo" || item.stage === "pro";
  const summary = owned ? item.activation : item.listing;
  const steps = owned ? ACTIVATION_KEYS : undefined;
  return (
    <Link
      href={`/admin/locales/${item.id}`}
      className={cn(
        "group flex items-center gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest transition-colors hover:border-primary/40",
        dense ? "px-3 py-2.5" : "px-4 py-3.5",
      )}
    >
      <RestaurantAvatar name={item.name} logoUrl={item.logoUrl} size={dense ? "sm" : "md"} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-bold text-on-surface">{item.name}</span>
          <StageBadge stage={item.stage} />
        </div>
        <p className="mt-0.5 truncate text-xs text-on-surface-variant">
          {[item.city, category].filter(Boolean).join(" · ") || `quiero.menu/${item.slug}`}
          {item.owner && ` · ${item.owner.email}`}
          {item.invitation && ` · invitación ${expiryLabel(item.invitation.expiresAt)}`}
        </p>
        {!dense && (
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-on-surface-variant sm:hidden">
            <ReadinessBar summary={summary} steps={steps} compact />
            <Metric icon="visibility" value={item.demand30d.views} title="Visitas en 30 días" />
            <Metric icon="chat" value={item.demand30d.whatsapp} title="Clicks a WhatsApp en 30 días" />
            <Metric icon="receipt_long" value={item.orders30d} title="Pedidos en 30 días" />
          </div>
        )}
        {item.ordersWithoutOwner && (
          <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">
            <MaterialIcon name="warning" size="xs" className="size-3" />
            Toma pedidos y no tiene dueño
          </p>
        )}
      </div>
      <div className="hidden shrink-0 items-center gap-5 text-xs text-on-surface-variant sm:flex">
        <ReadinessBar summary={summary} steps={steps} compact={dense || owned} />
        {!dense && (
          <div className="flex w-36 justify-end gap-3">
            <Metric icon="visibility" value={item.demand30d.views} title="Visitas en 30 días" />
            <Metric icon="chat" value={item.demand30d.whatsapp} title="Clicks a WhatsApp en 30 días" />
            <Metric icon="receipt_long" value={item.orders30d} title="Pedidos en 30 días" />
          </div>
        )}
      </div>
      <MaterialIcon name="chevron_right" size="sm" className="shrink-0 text-outline transition-colors group-hover:text-primary" />
    </Link>
  );
}
