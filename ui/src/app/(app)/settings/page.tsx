"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RestaurantDataSettings } from "@/components/settings/restaurant-data-settings";
import { PaymentMethodsSettings } from "@/components/settings/payment-methods-settings";
import { OperatingHoursSettings } from "@/components/settings/operating-hours-settings";

export const SETTINGS_TABS = ["datos", "pagos", "horarios"] as const;
export type SettingsTab = (typeof SETTINGS_TABS)[number];

// Tabs legacy de la vieja /settings y de /business/* -> destino nuevo
const LEGACY_TAB_REDIRECTS: Record<string, string> = {
  general: "/settings?tab=datos",
  payments: "/settings?tab=pagos",
  hours: "/settings?tab=horarios",
  data: "/settings?tab=datos",
  pagos: "/settings?tab=pagos",
  horarios: "/settings?tab=horarios",
  billing: "/billing",
  kitchen: "/orders",
  "delivery-portal": "/orders",
  notifications: "/account",
};

function SettingsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  // Tabs legacy de la vieja /settings y de /business/* -> destino nuevo
  useEffect(() => {
    if (!tabParam || SETTINGS_TABS.includes(tabParam as SettingsTab)) return;
    const legacy = LEGACY_TAB_REDIRECTS[tabParam];
    router.replace(legacy ?? "/settings");
  }, [tabParam, router]);

  // El tab activo se deriva de la URL: una sola fuente de verdad
  const activeTab: SettingsTab =
    tabParam && SETTINGS_TABS.includes(tabParam as SettingsTab)
      ? (tabParam as SettingsTab)
      : "datos";

  const handleTabChange = (value: string) => {
    router.replace(`/settings?tab=${value}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ajustes</h1>
        <p className="text-sm text-muted-foreground">
          Configurá tu restaurante una vez y olvidate
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="overflow-x-auto overflow-y-hidden -mx-1 px-1">
          <TabsList>
            <TabsTrigger value="datos">Datos del restaurante</TabsTrigger>
            <TabsTrigger value="pagos">Pagos</TabsTrigger>
            <TabsTrigger value="horarios">Horarios</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="datos" className="mt-4">
          <RestaurantDataSettings />
        </TabsContent>

        <TabsContent value="pagos" className="mt-4">
          <PaymentMethodsSettings />
        </TabsContent>

        <TabsContent value="horarios" className="mt-4">
          <OperatingHoursSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsPageInner />
    </Suspense>
  );
}
