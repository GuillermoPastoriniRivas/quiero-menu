"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const TAB_REDIRECTS: Record<string, string> = {
  general: "/business/data",
  payments: "/business/payments",
  delivery: "/business/zones",
  hours: "/business/hours",
  billing: "/billing",
  kitchen: "/account?tab=access",
  "delivery-portal": "/account?tab=access",
  notifications: "/account",
};

function SettingsRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get("tab") ?? "general";
    router.replace(TAB_REDIRECTS[tab] ?? "/business/data");
  }, [router, searchParams]);

  return null;
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsRedirect />
    </Suspense>
  );
}