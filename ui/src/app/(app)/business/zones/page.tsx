"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DeliveryZone } from "@/types";
import { MaterialIcon } from "@/components/ui/material-icon";
import { toast } from "sonner";

export default function BusinessZonesPage() {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [newZoneName, setNewZoneName] = useState("");
  const [newZonePrice, setNewZonePrice] = useState("");

  const loadZones = async () => {
    const data = await api.get<DeliveryZone[]>("/delivery-zones");
    setZones(data);
  };

  useEffect(() => {
    let cancelled = false;
    api
      .get<DeliveryZone[]>("/delivery-zones")
      .then((data) => {
        if (!cancelled) setZones(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreateZone = async () => {
    if (!newZoneName || !newZonePrice) return;
    await api.post("/delivery-zones", {
      name: newZoneName,
      price: Number(newZonePrice),
    });
    setNewZoneName("");
    setNewZonePrice("");
    loadZones();
    toast.success("Zona creada");
  };

  const handleDeleteZone = async (id: string) => {
    await api.delete(`/delivery-zones/${id}`);
    loadZones();
    toast.success("Zona eliminada");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Zonas de delivery</h1>

      <Card>
        <CardHeader>
          <CardTitle>Zonas de delivery</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Nombre de zona"
              value={newZoneName}
              onChange={(e) => setNewZoneName(e.target.value)}
              className="flex-1"
            />
            <Input
              type="number"
              placeholder="Precio"
              value={newZonePrice}
              onChange={(e) => setNewZonePrice(e.target.value)}
              className="w-full sm:w-32"
            />
            <Button onClick={handleCreateZone}>
              <MaterialIcon name="add" size="sm" className="mr-1" />
              Agregar
            </Button>
          </div>
          {zones.map((zone) => (
            <div
              key={zone.id}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div>
                <span className="font-medium">{zone.name}</span>
                <span className="ml-2 text-sm text-muted-foreground">
                  ${zone.price.toLocaleString()}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteZone(zone.id)}
              >
                <MaterialIcon
                  name="delete"
                  size="sm"
                  className="text-destructive"
                />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}