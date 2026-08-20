"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRestaurantStore } from "@/stores/restaurant.store";
import { useAuthStore } from "@/stores/auth.store";
import { ApiError } from "@/lib/api";
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
import { MaterialIcon } from "@/components/ui/material-icon";
import { toast } from "sonner";

export default function BusinessDataPage() {
  const { restaurant, fetch: fetchRestaurant, update } = useRestaurantStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [currency, setCurrency] = useState("");
  const [slug, setSlug] = useState("");
  const [instagram, setInstagram] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingSlug, setSavingSlug] = useState(false);

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
      setCurrency(restaurant.currency);
      setSlug(restaurant.slug);
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

  const handleSaveSlug = async () => {
    const candidate = slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    if (!candidate || candidate.length < 2) {
      toast.error("La URL debe tener al menos 2 caracteres");
      return;
    }
    setSavingSlug(true);
    try {
      await update({ slug: candidate });
      setSlug(candidate);
      const user = useAuthStore.getState().user;
      if (user) {
        useAuthStore.setState({ user: { ...user, restaurantSlug: candidate } });
      }
      toast.success("URL actualizada");
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        toast.error("Esa URL ya esta en uso. Proba con otra.");
      } else {
        toast.error(
          e instanceof Error ? e.message : "Error al actualizar la URL",
        );
      }
    } finally {
      setSavingSlug(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Datos del restaurante</h1>

      <Card>
        <CardHeader>
          <CardTitle>Información básica</CardTitle>
          <CardDescription>
            Los datos que ven tus clientes en tu menú público
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link
            href="/apariencia"
            className="flex items-center justify-between rounded-xl border border-outline-variant/20 bg-surface-container-low/60 p-4 hover:bg-surface-container-low transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl gradient-cta flex items-center justify-center text-white shrink-0">
                <MaterialIcon name="palette" size="md" />
              </div>
              <div>
                <p className="font-bold text-sm">
                  Logo, banner y color de botones
                </p>
                <p className="text-xs text-muted-foreground">
                  Personalizá el look de tu menú público y mirá cómo queda
                  antes de publicarlo
                </p>
              </div>
            </div>
            <MaterialIcon
              name="chevron_right"
              size="md"
              className="text-on-surface-variant"
            />
          </Link>
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
            <Label className="text-base font-semibold">
              Redes sociales
            </Label>
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

      {restaurant && (
        <Card>
          <CardHeader>
            <CardTitle>Link público</CardTitle>
            <CardDescription>
              Compartí este link con tus clientes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label>URL de tu menu</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                quiero.menu/
              </span>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="mi-restaurante"
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={handleSaveSlug}
                disabled={
                  savingSlug ||
                  !slug.trim() ||
                  slug.trim() === restaurant?.slug
                }
              >
                {savingSlug ? "Guardando..." : "Guardar"}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={`${window.location.origin}/${restaurant.slug}`}
                readOnly
              />
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${window.location.origin}/${restaurant.slug}`,
                  );
                  toast.success("Link copiado");
                }}
              >
                <MaterialIcon name="content_copy" size="sm" />
              </Button>
            </div>
            <Link
              href="/publicar"
              className="inline-flex items-center gap-1 text-sm text-primary font-medium hover:underline"
            >
              <MaterialIcon name="qr_code_2" size="sm" />
              QR, WhatsApp y mas opciones
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}