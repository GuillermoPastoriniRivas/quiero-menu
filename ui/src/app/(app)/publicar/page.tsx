"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";

function PublicarRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/mi-menu?tab=compartir");
  }, [router]);

  return null;
}

export default function MiMenuRedirectPage() {
  return (
    <Suspense fallback={null}>
      <PublicarRedirect />
    </Suspense>
  );
}
