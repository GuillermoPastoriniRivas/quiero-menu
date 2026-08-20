"use client";

import { useEffect, useRef } from "react";
import { useRestaurantStore } from "@/stores/restaurant.store";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";

const POLL_MS = 60_000;

/**
 * Mantiene el estado abierto/cerrado del local actualizado en todo el panel:
 * - Carga los horarios + estado al entrar.
 * - Escucha `restaurant.updated` (toggle manual / cambios de horarios) por socket.
 * - Refresca cada 60s para que el badge cambie solo al cruzar una hora de cierre/apertura.
 */
export function OpenStatusProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const fetchHours = useRestaurantStore((s) => s.fetchHours);
  const appliedRef = useRef(false);

  useEffect(() => {
    if (!appliedRef.current) {
      appliedRef.current = true;
      fetchHours().catch(() => {});
    }

    connectSocket();
    const socket = getSocket();
    const onRestaurantUpdated = () => fetchHours().catch(() => {});
    socket.on("restaurant.updated", onRestaurantUpdated);

    const interval = setInterval(() => fetchHours().catch(() => {}), POLL_MS);

    return () => {
      socket.off("restaurant.updated", onRestaurantUpdated);
      clearInterval(interval);
      disconnectSocket();
    };
  }, [fetchHours]);

  return <>{children}</>;
}
