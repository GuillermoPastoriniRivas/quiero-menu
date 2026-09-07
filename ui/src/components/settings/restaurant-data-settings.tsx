"use client";

import { useEffect, useState } from "react";
import { useRestaurantStore } from "@/stores/restaurant.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { toast } from "sonner";
import { RESTAURANT_CATEGORIES } from "@/lib/restaurant-categories";

const SELECT_CLASSES =
  "h-11 w-full rounded-xl border-none bg-surface-container-low px-4 py-2 text-base outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/30 md:text-sm dark:bg-surface-container";

export function RestaurantDataSettings() {
  const { restaurant, fetch: fetchRestaurant, update } = useRestaurantStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [currency, setCurrency] = useState("");
  const [instagram, setInstagram] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRestaurant();
  }, [fetchRestaurant]);

  useEffect(() => {
    if (restaurant) {
      setName(restaurant.name);
      setDescription(restaurant.description);
      setPhone(restaurant.phone);
      setAddress(restaurant.address);
      setCity(restaurant.city);
      setCategory(restaurant.category || "");
      setCurrency(restaurant.currency);
      setInstagram(restaurant.socialLinks?.instagram || "");
    }
  }, [restaurant]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await update({
        name,
        description,
        phone,
        address,
        city,
        category: (category || undefined) as never,
        currency,
        socialLinks: { instagram: instagram || undefined },
      });
      toast.success("Datos guardados");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información básica</CardTitle>
        <CardDescription>
          Los datos que ven tus clientes en tu menú público
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Teléfono (WhatsApp)</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+57..."
            />
          </div>
          <div className="space-y-2">
            <Label>Dirección</Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Ciudad</Label>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Rubro</Label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={SELECT_CLASSES}
            >
              <option value="">Sin clasificar</option>
              {RESTAURANT_CATEGORIES.filter((c) => c.value !== "otro").map(
                (c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ),
              )}
              <option value="otro">Otro</option>
            </select>
            <p className="text-xs text-on-surface-variant">
              Ayuda a que te encuentren en el directorio de tu ciudad.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Moneda</Label>
            <Input
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Sobre nosotros</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Contale a tus clientes sobre tu negocio"
          />
        </div>
        <div className="space-y-2 pt-2">
          <Label className="text-base font-semibold">Redes sociales</Label>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Instagram</Label>
              <Input
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@tucuenta"
              />
            </div>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </CardContent>
    </Card>
  );
}
