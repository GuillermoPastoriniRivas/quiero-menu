import Link from "next/link";

export default function GuidesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface">
      <header className="border-b border-outline-variant/40">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
          <Link href="/" className="text-lg font-extrabold">quiero<span className="text-primary">.menu</span></Link>
          <Link href="/locales" className="text-sm font-bold text-primary hover:underline">Explorar locales</Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-10 sm:py-16">{children}</main>
      <footer className="border-t border-outline-variant/40 px-5 py-8">
        <nav aria-label="Información de quiero.menu" className="mx-auto flex max-w-5xl flex-wrap gap-6 text-sm text-on-surface-variant">
          <Link href="/guias">Guías</Link><Link href="/locales">Directorio</Link><Link href="/#precios">Planes vigentes</Link><Link href="/privacy">Privacidad</Link>
        </nav>
      </footer>
    </div>
  );
}
