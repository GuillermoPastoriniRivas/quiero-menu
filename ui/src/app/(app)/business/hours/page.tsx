"use client";

import { useEffect, useState } from "react";
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

export default function BusinessHoursPage() {
  const { fetch: fetchRestaurant, updateHours, operatingHours } =
    useRestaurantStore();
  const defaultHours: Omit<OperatingHours, "id" | "restaurantId">[] =
    Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      opensAt: "09:00",
      closesAt: "22:00",
      isClosed: false,
    }));
  const [hours, setHours] = useState(defaultHours);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRestaurant();
  }, [fetchRestaurant]);

  // Cargar los horarios guardados (no pisar con defaults al guardar)
  useEffect(() => {
    if (operatingHours.length > 0) {
      setHours(
        operatingHours.map((h) => ({
          dayOfWeek: h.dayOfWeek,
          opensAt: h.opensAt,
          closesAt: h.closesAt,
          isClosed: h.isClosed,
        })),
      );
    }
  }, [operatingHours]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateHours(hours);
      toast.success("Horarios guardados");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar horarios");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Horarios</h1>

      <Card>
        <CardHeader>
          <CardTitle>Horarios de atención</CardTitle>
          <CardDescription>
            Configurá los horarios de apertura y cierre para cada día
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hours.map((h, i) => (
            <div
              key={h.dayOfWeek}
              className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 rounded-md border p-3"
            >
              <span className="font-medium">{DAY_NAMES[i]}</span>
              <div className="flex items-center gap-3 sm:ml-auto">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={h.isClosed}
                    onCheckedChange={(checked) =>
                      setHours((prev) =>
                        prev.map((row, j) =>
                          j === i ? { ...row, isClosed: checked } : row,
                        ),
                      )
                    }
                  />
                  <Label className="text-sm text-muted-foreground">
                    Cerrado
                  </Label>
                </div>
                {!h.isClosed && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={h.opensAt}
                      className="w-28"
                      onChange={(e) =>
                        setHours((prev) =>
                          prev.map((row, j) =>
                            j === i
                              ? { ...row, opensAt: e.target.value }
                              : row,
                          ),
                        )
                      }
                    />
                    <span className="text-muted-foreground">a</span>
                    <Input
                      type="time"
                      value={h.closesAt}
                      className="w-28"
                      onChange={(e) =>
                        setHours((prev) =>
                          prev.map((row, j) =>
                            j === i
                              ? { ...row, closesAt: e.target.value }
                              : row,
                          ),
                        )
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
          <Button disabled={saving} onClick={handleSave}>
            {saving ? "Guardando..." : "Guardar horarios"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}