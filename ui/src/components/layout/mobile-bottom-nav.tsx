'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MaterialIcon } from '@/components/ui/material-icon';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { MOBILE_PRIMARY, NAV_SECTIONS } from '@/components/layout/nav-items';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-outline-variant/40 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-stretch justify-around">
          {MOBILE_PRIMARY.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 py-2.5 px-2 flex-1 text-[10px] font-semibold transition-colors',
                isActive(item.href) ? 'text-primary' : 'text-on-surface-variant'
              )}
            >
              <MaterialIcon name={item.icon} size="md" fill={isActive(item.href)} />
              <span className="truncate max-w-full">{item.label}</span>
            </Link>
          ))}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              'flex flex-col items-center gap-0.5 py-2.5 px-2 flex-1 text-[10px] font-semibold',
              NAV_SECTIONS.some((s) => s.items.some((i) => isActive(i.href)))
                ? 'text-primary'
                : 'text-on-surface-variant'
            )}
          >
            <MaterialIcon name="apps" size="md" />
            <span>Más</span>
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-8">
          <SheetHeader>
            <SheetTitle>Todas las secciones</SheetTitle>
          </SheetHeader>
          <div className="max-h-[70vh] overflow-y-auto px-4 pt-2 space-y-5">
            {NAV_SECTIONS.map((section) => (
              <div key={section.label}>
                <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/70 px-2 mb-2">
                  {section.label}
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        'flex flex-col items-center gap-2 rounded-2xl p-4 text-xs font-semibold transition-colors',
                        isActive(item.href)
                          ? 'bg-surface-container text-primary'
                          : 'bg-surface-container-low text-on-surface'
                      )}
                    >
                      <MaterialIcon name={item.icon} size="lg" fill={isActive(item.href)} />
                      <span className="text-center leading-tight">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}