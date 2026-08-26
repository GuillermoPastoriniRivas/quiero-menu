"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";

function CouponsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/promos");
  }, [router]);

  return null;
}

export default function CouponsPage() {
  return (
    <Suspense fallback={null}>
      <CouponsRedirect />
    </Suspense>
  );
}
