import type { Metadata } from "next";
import Link from "next/link";
import { PUBLIC_GUIDES } from "@/lib/public-guides";
import { DirectoryBreadcrumbs } from "@/components/directory/directory-breadcrumbs";

export const metadata: Metadata = {
  title: "Guías de menú digital y carta QR",
  description: "Guías prácticas para publicar una carta digital, usar un QR y elegir entre PDF, menú web y pedidos online.",
  alternates: { canonical: "https://quiero.menu/guias" },
};

export default function GuidesPage() {
  return (
    <>
      <DirectoryBreadcrumbs items={[{ name: "quiero.menu", url: "https://quiero.menu" }, { name: "Guías", url: "https://quiero.menu/guias" }]} />
      <h1 className="text-3xl font-extrabold sm:text-4xl">Guías para publicar y compartir tu carta</h1>
      <p className="mt-4 max-w-2xl text-lg text-on-surface-variant">Decisiones prácticas para tu local: cómo preparar el menú, distribuirlo y mantenerlo actualizado.</p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {PUBLIC_GUIDES.map((guide) => (
          <Link key={guide.slug} href={`/guias/${guide.slug}`} className="rounded-2xl border border-outline-variant/40 p-6 transition-colors hover:border-primary">
            <h2 className="text-xl font-bold">{guide.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">{guide.description}</p>
            <p className="mt-5 font-semibold text-primary">Leer guía →</p>
          </Link>
        ))}
      </div>
    </>
  );
}
