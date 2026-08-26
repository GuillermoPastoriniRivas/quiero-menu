"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";

function BusinessHoursRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/settings?tab=horarios");
  }, [router]);

  return null;
}

export default function BusinessHoursPage() {
  return (
    <Suspense fallback={null}>
      <BusinessHoursRedirect />
    </Suspense>
  );
}
