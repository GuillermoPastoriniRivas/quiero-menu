import { AuthProvider } from '@/components/auth/auth-provider';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
import { MaterialIcon } from '@/components/ui/material-icon';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 min-w-0 overflow-auto pb-24 lg:pb-8 bg-surface-container-low">
          {/* Mobile Top Bar */}
          <header className="lg:hidden flex justify-between items-center w-full px-6 h-16 bg-white/90 backdrop-blur-xl sticky top-0 z-40 border-b border-outline-variant/10">
            <div className="flex items-center gap-2">
              <MaterialIcon name="receipt_long" size="md" className="text-primary" />
              <span className="text-lg font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Quiero Menu</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center">
              <MaterialIcon name="person" size="sm" className="text-on-surface-variant" />
            </div>
          </header>
          <div className="max-w-5xl mx-auto p-6">
            {children}
          </div>
        </main>
        <MobileBottomNav />
      </div>
    </AuthProvider>
  );
}
