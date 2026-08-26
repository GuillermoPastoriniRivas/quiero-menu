"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";

function BusinessPaymentsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/settings?tab=pagos");
  }, [router]);

  return null;
}

export default function BusinessPaymentsPage() {
  return (
    <Suspense fallback={null}>
      <BusinessPaymentsRedirect />
    </Suspense>
  );
}
