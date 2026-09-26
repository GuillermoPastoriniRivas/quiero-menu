import { MaterialIcon } from "@/components/ui/material-icon";
import { READINESS_BY_KEY, LISTING_STEP_KEYS } from "@/lib/readiness";
import { cn } from "@/lib/utils";
import type { AdminStage, ReadinessStep, ReadinessSummary } from "@/types";

export const STAGE_META: Record<
  AdminStage,
  { label: string; plural: string; icon: string; hint: string; badge: string; dot: string }
> = {
  ficha: {
    label: "Ficha",
    plural: "Fichas",
    icon: "storefront",
    hint: "Sin dueño ni invitación",
    badge: "bg-surface-container-high text-on-surface-variant",
    dot: "bg-outline",
  },
  invitado: {
    label: "Invitado",
    plural: "Invitados",
    icon: "link",
    hint: "Link enviado, falta que entre",
    badge: "bg-tertiary-fixed text-tertiary",
    dot: "bg-tertiary",
  },
  activo: {
    label: "Activo",
    plural: "Activos",
    icon: "verified",
    hint: "Con dueño, plan gratis",
    badge: "bg-success-container text-on-success-container",
    dot: "bg-success",
  },
  pro: {
    label: "Pro",
    plural: "Pro",
    icon: "workspace_premium",
    hint: "Paga el plan",
    badge: "bg-primary/10 text-primary",
    dot: "bg-primary",
  },
  pausado: {
    label: "Pausado",
    plural: "Pausados",
    icon: "block",
    hint: "Suspendido o pausado",
    badge: "bg-error-container text-on-error-container",
    dot: "bg-error",
  },
};

export const STAGE_ORDER: AdminStage[] = ["ficha", "invitado", "activo", "pro", "pausado"];

export function StageBadge({ stage, className }: { stage: AdminStage; className?: string }) {
  const meta = STAGE_META[stage];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold",
        meta.badge,
        className,
      )}
    >
      <MaterialIcon name={meta.icon} size="xs" className="size-3" />
      {meta.label}
    </span>
  );
}

export function ReadinessBar({
  summary,
  steps = LISTING_STEP_KEYS,
  compact = false,
}: {
  summary: ReadinessSummary;
  steps?: ReadinessStep[];
  compact?: boolean;
}) {
  const missing = new Set(summary.missing);
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5" aria-label={`Completitud ${summary.done} de ${summary.total}`}>
        {steps.map((step) => {
          const done = !missing.has(step);
          return (
            <span
              key={step}
              title={`${READINESS_BY_KEY[step].label}: ${done ? "listo" : "falta"}`}
              className={cn(
                "flex items-center justify-center rounded",
                compact ? "h-1.5 w-3" : "h-5 w-5",
                done ? "bg-success text-white" : "bg-surface-container-high text-outline",
              )}
            >
              {!compact && <MaterialIcon name={READINESS_BY_KEY[step].icon} size="xs" className="size-3" />}
            </span>
          );
        })}
      </div>
      <span
        className={cn(
          "text-xs font-bold tabular-nums",
          summary.percent === 100 ? "text-success" : "text-on-surface-variant",
        )}
      >
        {summary.done}/{summary.total}
      </span>
    </div>
  );
}

export function daysUntil(date: string): number {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);
}

export function expiryLabel(date: string): string {
  const days = daysUntil(date);
  if (days <= 0) return "vence hoy";
  if (days === 1) return "vence mañana";
  return `vence en ${days} días`;
}
