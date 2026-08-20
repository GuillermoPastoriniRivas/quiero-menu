"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { useRestaurantStore } from "@/stores/restaurant.store";
import { Logo } from "@/components/ui/logo";
import { MaterialIcon } from "@/components/ui/material-icon";
import { OpenStatusBadge } from "@/components/layout/open-status-badge";
import { NAV_SECTIONS } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { restaurant } = useRestaurantStore();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const displayName = restaurant?.name || user?.name || "Mi Restaurante";
  const initials = displayName.slice(0, 2).toUpperCase();
  const slug = restaurant?.slug || user?.restaurantSlug;

  const toggleSection = (label: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  const userLinkClass =
    "flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors w-full py-0.5";

  return (
    <aside className="hidden lg:flex flex-col h-screen w-72 bg-white sticky top-0 shadow-[4px_0_16px_rgba(0,0,0,0.03)]">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-8">
        <Logo size="lg" href="/dashboard" />
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 px-4 mt-2 flex-1 overflow-y-auto">
        {NAV_SECTIONS.map((section) => {
          const isCollapsed = collapsed.has(section.label);
          return (
            <div key={section.label} className="mb-3">
              <button
                type="button"
                onClick={() => toggleSection(section.label)}
                className="w-full flex items-center justify-between px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant/70 hover:text-on-surface-variant transition-colors"
              >
                <span>{section.label}</span>
                <MaterialIcon
                  name={isCollapsed ? "expand_more" : "expand_less"}
                  size="xs"
                  className="text-on-surface-variant/50"
                />
              </button>
              {!isCollapsed && (
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 active:translate-x-0.5",
                          isActive
                            ? "bg-surface-container-low text-primary"
                            : "text-on-surface hover:bg-surface-container-low",
                        )}
                      >
                        <MaterialIcon name={item.icon} size="md" fill={isActive} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User card at bottom */}
      <div className="p-4 space-y-3">
        <OpenStatusBadge />
        <div className="bg-surface-container-low rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-cta flex items-center justify-center text-white font-bold text-sm">
              {initials}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-bold truncate">{displayName}</p>
              <p className="text-xs text-on-surface-variant truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <div className="mt-3 space-y-0.5">
            {slug && (
              <Link href={`/${slug}`} className={userLinkClass}>
                <MaterialIcon name="storefront" size="sm" />
                Mi menú público
              </Link>
            )}
            <Link href="/account" className={userLinkClass}>
              <MaterialIcon name="notifications" size="sm" />
              Notificaciones
            </Link>
            <Link href="/account?tab=access" className={userLinkClass}>
              <MaterialIcon name="key" size="sm" />
              Accesos
            </Link>
            <Link href="/billing" className={userLinkClass}>
              <MaterialIcon name="workspace_premium" size="sm" />
              Plan y facturación
            </Link>
            <button
              onClick={logout}
              className="mt-1 flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors w-full"
            >
              <MaterialIcon name="logout" size="sm" />
              Cerrar sesion
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}