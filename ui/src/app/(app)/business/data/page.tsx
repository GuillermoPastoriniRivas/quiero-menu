"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const BUSINESS_TAB_REDIRECTS: Record<string, string> = {
  data: "/settings?tab=datos",
  payments: "/settings?tab=pagos",
  hours: "/settings?tab=horarios",
};

function BusinessRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get("tab") ?? "data";
    router.replace(BUSINESS_TAB_REDIRECTS[tab] ?? "/settings");
  }, [router, searchParams]);

  return null;
}

export default function BusinessDataPage() {
  return (
    <Suspense fallback={null}>
      <BusinessRedirect />
    </Suspense>
  );
}
