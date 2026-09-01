"use client";

import { useEffect, useState, useMemo } from "react";
import { useRestaurantStore } from "@/stores/restaurant.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { MaterialIcon } from "@/components/ui/material-icon";
import type { OperatingHours } from "@/types";
import { toast } from "sonner";

const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

type DaySchedule = {
  dayOfWeek: number;
  isClosed: boolean;
  ranges: Array<{ opensAt: string; closesAt: string }>;
};

const MAX_RANGES = 3;

function toSchedules(operatingHours: OperatingHours[]): DaySchedule[] {
  return Array.from({ length: 7 }, (_, i) => {
    const entries = operatingHours.filter((h) => h.dayOfWeek === i);
    if (entries.length === 0) {
      return { dayOfWeek: i, isClosed: false, ranges: [{ opensAt: "09:00", closesAt: "22:00" }] };
    }
    if (entries.some((e) => e.isClosed)) {
      return { dayOfWeek: i, isClosed: true, ranges: [] };
    }
    const ranges = entries
      .map((e) => ({ opensAt: e.opensAt, closesAt: e.closesAt }))
      .sort((a, b) => a.opensAt.localeCompare(b.opensAt));
    return { dayOfWeek: i, isClosed: false, ranges: ranges.length ? ranges : [{ opensAt: "09:00", closesAt: "22:00" }] };
  });
}

function flattenSchedules(schedules: DaySchedule[]): Omit<OperatingHours, "id" | "restaurantId">[] {
  const out: Omit<OperatingHours, "id" | "restaurantId">[] = [];
  for (const s of schedules) {
    if (s.isClosed) {
      out.push({ dayOfWeek: s.dayOfWeek, opensAt: "09:00", closesAt: "22:00", isClosed: true });
    } else {
      const ranges = s.ranges.length ? s.ranges : [{ opensAt: "09:00", closesAt: "22:00" }];
      for (const r of ranges) {
        out.push({ dayOfWeek: s.dayOfWeek, opensAt: r.opensAt, closesAt: r.closesAt, isClosed: false });
      }
    }
  }
  return out;
}

export function OperatingHoursSettings() {
  const { fetch: fetchRestaurant, updateHours, operatingHours } =
    useRestaurantStore();

  const [schedules, setSchedules] = useState<DaySchedule[]>(() =>
    Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      isClosed: false,
      ranges: [{ opensAt: "09:00", closesAt: "22:00" }],
    })),
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRestaurant();
  }, [fetchRestaurant]);

  useEffect(() => {
    if (operatingHours.length > 0) {
      setSchedules(toSchedules(operatingHours));
    }
  }, [operatingHours]);

  const handleSave = async () => {
    // validaciones livianas
    for (const s of schedules) {
      if (s.isClosed) continue;
      for (const r of s.ranges) {
        if (!r.opensAt || !r.closesAt) {
          toast.error(`Completá todos los horarios de ${DAY_NAMES[s.dayOfWeek]}`);
          return;
        }
        if (r.opensAt === r.closesAt) {
          toast.error(`Horario inválido en ${DAY_NAMES[s.dayOfWeek]}: apertura y cierre no pueden ser iguales`);
          return;
        }
      }
      // solapamiento simple (asume rangos ordenados)
      const sorted = [...s.ranges].sort((a, b) => a.opensAt.localeCompare(b.opensAt));
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].opensAt < sorted[i - 1].closesAt && sorted[i - 1].closesAt > sorted[i - 1].opensAt) {
          // permite 16:00 después de 12:00, pero no 10:00 antes de que cierre 12:00
          if (sorted[i].opensAt < sorted[i - 1].closesAt) {
            toast.error(`Horarios solapados en ${DAY_NAMES[s.dayOfWeek]}`);
            return;
          }
        }
      }
    }
    setSaving(true);
    try {
      await updateHours(flattenSchedules(schedules));
      toast.success("Horarios guardados");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar horarios");
    } finally {
      setSaving(false);
    }
  };

  const toggleClosed = (dayIdx: number, closed: boolean) => {
    setSchedules((prev) =>
      prev.map((s, j) =>
        j === dayIdx
          ? closed
            ? { ...s, isClosed: true, ranges: [] }
            : { ...s, isClosed: false, ranges: [{ opensAt: "09:00", closesAt: "22:00" }] }
          : s,
      ),
    );
  };

  const updateRange = (dayIdx: number, rangeIdx: number, patch: Partial<{ opensAt: string; closesAt: string }>) => {
    setSchedules((prev) =>
      prev.map((s, j) => {
        if (j !== dayIdx) return s;
        const nextRanges = s.ranges.map((r, k) => (k === rangeIdx ? { ...r, ...patch } : r));
        return { ...s, ranges: nextRanges };
      }),
    );
  };

  const addRange = (dayIdx: number) => {
    setSchedules((prev) =>
      prev.map((s, j) => {
        if (j !== dayIdx) return s;
        if (s.ranges.length >= MAX_RANGES) return s;
        const last = s.ranges[s.ranges.length - 1];
        // sugerencia: turno tarde si ya existe mañana (ej 08-12 -> 16-20)
        const suggestion = last && last.closesAt <= "12:00" ? { opensAt: "16:00", closesAt: "20:00" } : { opensAt: "16:00", closesAt: "22:00" };
        return { ...s, ranges: [...s.ranges, suggestion] };
      }),
    );
  };

  const removeRange = (dayIdx: number, rangeIdx: number) => {
    setSchedules((prev) =>
      prev.map((s, j) => {
        if (j !== dayIdx) return s;
        if (s.ranges.length <= 1) return s;
        return { ...s, ranges: s.ranges.filter((_, k) => k !== rangeIdx) };
      }),
    );
  };

  const hasValidationIssue = useMemo(() => {
    return schedules.some((s) => !s.isClosed && s.ranges.some((r) => !r.opensAt || !r.closesAt));
  }, [schedules]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Horarios de atención</CardTitle>
        <CardDescription>
          Configurá los horarios de apertura y cierre para cada día. Podés agregar dos rangos (ej 08:00–12:00 y 16:00–20:00) para locales con corte.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 min-w-0">
        {schedules.map((s, i) => (
          <div
            key={s.dayOfWeek}
            className="flex flex-col gap-3 rounded-md border p-3 min-w-0 sm:gap-4"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium shrink-0">{DAY_NAMES[i]}</span>
              <div className="flex items-center gap-2 shrink-0">
                <Switch
                  checked={s.isClosed}
                  onCheckedChange={(checked) => toggleClosed(i, checked)}
                />
                <Label className="text-sm text-muted-foreground">
                  Cerrado
                </Label>
              </div>
            </div>

            {!s.isClosed && (
              <div className="space-y-2">
                {s.ranges.map((r, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 w-full min-w-0"
                  >
                    <Input
                      type="time"
                      value={r.opensAt}
                      className="min-w-0 flex-1 sm:flex-none sm:w-28"
                      onChange={(e) => updateRange(i, idx, { opensAt: e.target.value })}
                    />
                    <span className="text-muted-foreground shrink-0 text-sm">a</span>
                    <Input
                      type="time"
                      value={r.closesAt}
                      className="min-w-0 flex-1 sm:flex-none sm:w-28"
                      onChange={(e) => updateRange(i, idx, { closesAt: e.target.value })}
                    />
                    {s.ranges.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeRange(i, idx)}
                        aria-label="Quitar horario"
                      >
                        <MaterialIcon name="close" size="sm" />
                      </Button>
                    )}
                  </div>
                ))}

                {s.ranges.length < MAX_RANGES && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => addRange(i)}
                  >
                    <MaterialIcon name="add" size="xs" className="mr-1" />
                    Agregar horario
                  </Button>
                )}

                {s.ranges.length === 1 && (
                  <p className="text-[11px] text-muted-foreground">
                    Ej: 08:00 a 12:00 y 16:00 a 20:00 para corte al mediodía.
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
        <Button disabled={saving || hasValidationIssue} onClick={handleSave}>
          {saving ? "Guardando..." : "Guardar horarios"}
        </Button>
      </CardContent>
    </Card>
  );
}
