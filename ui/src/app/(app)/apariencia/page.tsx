"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AparienciaRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get("tab") === "share" ? "compartir" : "diseno";
    router.replace(`/mi-menu?tab=${tab}`);
  }, [router, searchParams]);

  return null;
}

export default function AparienciaPage() {
  return (
    <Suspense fallback={null}>
      <AparienciaRedirect />
    </Suspense>
  );
}
