"use client";

import { useState } from "react";
import Link from "next/link";
import { MaterialIcon } from "@/components/ui/material-icon";
import { ProgressRing } from "@/components/ui/progress-ring";
import { READINESS_BY_KEY, READINESS_STEPS } from "@/lib/readiness";
import { formatWhatsAppDisplay } from "@/lib/ar-phone";
import { cn } from "@/lib/utils";
import type { ActivationStatus, ReadinessStep } from "@/types";

function dismissKey(slug: string) {
  return `qm-activation-done:${slug}`;
}

function readDismissed(slug: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(dismissKey(slug)) === "1";
  } catch {
    return false;
  }
}

function writeDismissed(slug: string): void {
  try {
    localStorage.setItem(dismissKey(slug), "1");
  } catch {
    return;
  }
}

function stepDetail(step: ReadinessStep, status: ActivationStatus): string {
  const { details, checks } = status;
  if (step === "menu" && checks.menu) {
    return `${details.menuItems} ${details.menuItems === 1 ? "plato" : "platos"} en tu carta.`;
  }
  if (step === "hours" && checks.hours) {
    return `Abrís ${details.openDays} ${details.openDays === 1 ? "día" : "días"} por semana.`;
  }
  if (step === "whatsapp" && details.whatsapp) {
    return `Te escriben al ${formatWhatsAppDisplay(details.whatsapp)}.`;
  }
  if (step === "payments" && details.transferMissingAccount) {
    return "Tenés la transferencia activa pero sin alias ni CBU: el cliente no sabe a dónde pagar.";
  }
  if (step === "firstOrder" && checks.firstOrder) {
    return `${details.orders} ${details.orders === 1 ? "pedido recibido" : "pedidos recibidos"}.`;
  }
  return READINESS_BY_KEY[step].why;
}

function StepAction({
  step,
  status,
  className,
  children,
}: {
  step: ReadinessStep;
  status: ActivationStatus;
  className?: string;
  children: React.ReactNode;
}) {
  if (step === "firstOrder") {
    return (
      <a href={`/${status.slug}`} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={READINESS_BY_KEY[step].href} className={className}>
      {children}
    </Link>
  );
}

export function ActivationPanel({ status }: { status: ActivationStatus }) {
  const [dismissed, setDismissed] = useState(() => readDismissed(status.slug));
  const [expanded, setExpanded] = useState(false);
  const { summary } = status;
  const complete = summary.done === summary.total;

  if (complete && dismissed) return null;

  if (complete) {
    return (
      <section className="relative overflow-hidden rounded-3xl gradient-cta p-6 text-white shadow-ambient-lg">
        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-wrap items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20">
            <MaterialIcon name="rocket_launch" size="lg" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-[family-name:var(--font-heading)] text-lg font-extrabold">
              Tu local está en marcha
            </p>
            <p className="text-sm text-white/85">
              Completaste los {summary.total} pasos. Ahora se trata de que tus clientes lo usen:
              mantené el link en tu Instagram y el QR a la vista.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              writeDismissed(status.slug);
              setDismissed(true);
            }}
            className="rounded-full bg-white/15 px-4 py-2 text-sm font-bold transition-colors hover:bg-white/25"
          >
            Listo, ocultar
          </button>
        </div>
      </section>
    );
  }

  const next = summary.next ?? summary.missing[0];
  const nextMeta = READINESS_BY_KEY[next];
  const remaining = summary.total - summary.done;

  return (
    <section
      id="puesta-en-marcha"
      className="overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm"
    >
      <div className="flex items-center gap-4 border-b border-outline-variant/20 p-5 sm:p-6">
        <ProgressRing value={summary.percent} size={60} stroke={6}>
          <span className="font-[family-name:var(--font-heading)] text-sm font-extrabold text-on-surface">
            {summary.done}/{summary.total}
          </span>
        </ProgressRing>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">Puesta en marcha</p>
          <h2 className="font-[family-name:var(--font-heading)] text-lg font-extrabold text-on-surface sm:text-xl">
            {remaining === 1
              ? "Te falta un paso para recibir pedidos"
              : `Te faltan ${remaining} pasos para recibir pedidos`}
          </h2>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.1fr_1fr]">
        <div className="border-b border-outline-variant/20 p-5 sm:p-6 lg:border-b-0 lg:border-r">
          <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Siguiente paso
          </p>
          <div className="mt-3 flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <MaterialIcon name={nextMeta.icon} size="md" />
            </span>
            <div className="min-w-0">
              <p className="font-[family-name:var(--font-heading)] text-base font-extrabold text-on-surface">
                {nextMeta.title}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
                {stepDetail(next, status)}
              </p>
            </div>
          </div>
          <StepAction
            step={next}
            status={status}
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl gradient-cta px-5 text-sm font-bold text-white shadow-md shadow-primary/20 transition-shadow hover:shadow-lg hover:shadow-primary/30"
          >
            {nextMeta.cta}
            <MaterialIcon name={next === "firstOrder" ? "open_in_new" : "arrow_forward"} size="sm" />
          </StepAction>
        </div>

        <div className="p-3 sm:p-4">
          <ul className={cn("grid gap-1", !expanded && "max-lg:[&>li:nth-child(n+5)]:hidden")}>
            {READINESS_STEPS.map((meta) => {
              const done = status.checks[meta.key];
              const isNext = meta.key === next;
              return (
                <li key={meta.key}>
                  <StepAction
                    step={meta.key}
                    status={status}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
                      isNext ? "bg-primary/5" : "hover:bg-surface-container-low",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                        done
                          ? "bg-success-container text-success"
                          : isNext
                            ? "bg-primary text-white"
                            : "bg-surface-container-high text-on-surface-variant",
                      )}
                    >
                      <MaterialIcon name={done ? "check" : meta.icon} size="xs" />
                    </span>
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate text-sm font-semibold",
                        done ? "text-on-surface-variant line-through decoration-outline/40" : "text-on-surface",
                      )}
                    >
                      {done ? meta.doneTitle : meta.title}
                    </span>
                    {!done && (
                      <MaterialIcon
                        name="chevron_right"
                        size="sm"
                        className="shrink-0 text-outline transition-colors group-hover:text-primary"
                      />
                    )}
                  </StepAction>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-1 w-full rounded-xl py-2 text-xs font-bold text-primary lg:hidden"
          >
            {expanded ? "Ver menos" : `Ver los ${summary.total} pasos`}
          </button>
        </div>
      </div>
    </section>
  );
}

export function ActivationNavCard({ status }: { status: ActivationStatus | null }) {
  if (!status || status.summary.done === status.summary.total) return null;
  const { summary } = status;
  return (
    <Link
      href="/dashboard#puesta-en-marcha"
      className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3 transition-colors hover:bg-primary/10"
    >
      <ProgressRing value={summary.percent} size={38} stroke={4}>
        <span className="text-[10px] font-extrabold text-on-surface">{summary.done}</span>
      </ProgressRing>
      <div className="min-w-0">
        <p className="text-xs font-bold text-on-surface">Puesta en marcha</p>
        <p className="truncate text-[11px] text-on-surface-variant">
          {summary.done} de {summary.total} · sigue: {READINESS_BY_KEY[summary.next ?? summary.missing[0]].label}
        </p>
      </div>
    </Link>
  );
}
