import { AuthProvider } from "@/components/auth/auth-provider";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { MobileUserMenu } from "@/components/layout/mobile-user-menu";
import { OpenStatusProvider } from "@/components/layout/open-status-provider";
import { OpenStatusBadge } from "@/components/layout/open-status-badge";
import { Logo } from "@/components/ui/logo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <OpenStatusProvider>
        <div className="flex min-h-screen">
          <AdminSidebar />
          <main className="flex-1 min-w-0 overflow-auto pb-24 lg:pb-8 bg-surface-container-low">
            {/* Mobile Top Bar */}
            <header className="lg:hidden flex justify-between items-center w-full px-4 h-16 bg-white/90 backdrop-blur-xl sticky top-0 z-40 border-b border-outline-variant/10">
              <div className="flex items-center gap-2">
                <Logo size="sm" href="/dashboard" />
              </div>
              <OpenStatusBadge compact />
              <MobileUserMenu />
            </header>
            <div className="max-w-5xl mx-auto p-6">{children}</div>
          </main>
          <MobileBottomNav />
        </div>
      </OpenStatusProvider>
    </AuthProvider>
  );
}
