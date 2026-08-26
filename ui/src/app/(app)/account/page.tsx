"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import { useRestaurantStore } from "@/stores/restaurant.store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MaterialIcon } from "@/components/ui/material-icon";
import { toast } from "sonner";

export default function AccountPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const restaurant = useRestaurantStore((s) => s.restaurant);
  const fetchRestaurant = useRestaurantStore((s) => s.fetch);

  const [exporting, setExporting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchRestaurant();
  }, [fetchRestaurant]);

  const displayName = user?.name || restaurant?.name || "";
  const initials = displayName.slice(0, 2).toUpperCase();

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await api.get<unknown>("/account/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `quiero-menu-datos-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Datos descargados");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al exportar los datos");
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletePassword) return;
    setDeleting(true);
    try {
      await api.delete("/account", { password: deletePassword });
      toast.success("Cuenta eliminada. Gracias por haber usado quiero.menu.");
      logout();
      router.replace("/");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al eliminar la cuenta");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Cuenta</h1>
        <p className="text-sm text-muted-foreground">
          Tu perfil y el control de tus datos
        </p>
      </div>

      {/* Perfil */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full gradient-cta flex items-center justify-center text-white font-bold text-lg shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-bold truncate">{user?.name || "Mi cuenta"}</p>
              <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
              {restaurant?.name && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  Restaurante: {restaurant.name}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datos */}
      <Card>
        <CardHeader>
          <CardTitle>Tus datos</CardTitle>
          <CardDescription>
            Descargá todo lo que hay en tu cuenta o dale de baja
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-medium">Exportar mis datos</p>
              <p className="text-sm text-muted-foreground">
                Descargá un archivo con tu menú, pedidos y configuración
              </p>
            </div>
            <Button variant="outline" onClick={handleExport} disabled={exporting} className="shrink-0">
              <MaterialIcon name="download" size="sm" className="mr-1" />
              {exporting ? "Exportando..." : "Exportar"}
            </Button>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-outline-variant/10 pt-4">
            <div className="min-w-0">
              <p className="font-medium text-destructive">Eliminar cuenta</p>
              <p className="text-sm text-muted-foreground">
                Borrá tu cuenta y todos tus datos de forma permanente
              </p>
            </div>
            <Button
              variant="outline"
              className="text-destructive shrink-0"
              onClick={() => {
                setDeletePassword("");
                setDeleteOpen(true);
              }}
            >
              <MaterialIcon name="delete_forever" size="sm" className="mr-1" />
              Eliminar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sesión */}
      <Card>
        <CardHeader>
          <CardTitle>Sesión</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={logout}>
            <MaterialIcon name="logout" size="sm" className="mr-1" />
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar tu cuenta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              Se borran tu menú, tus pedidos, tus clientes y tu suscripción. Esta
              acción no se puede deshacer. Confirmá tu contraseña para continuar.
            </p>
            <div className="space-y-2">
              <Label>Contraseña</Label>
              <Input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Tu contraseña"
                onKeyDown={(e) => e.key === "Enter" && handleDelete()}
              />
            </div>
            <Button
              variant="destructive"
              className="w-full"
              disabled={!deletePassword || deleting}
              onClick={handleDelete}
            >
              {deleting ? "Eliminando..." : "Eliminar definitivamente"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
