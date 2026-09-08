import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchStorefrontData } from "@/lib/storefront-data";
import { ClaimForm } from "@/components/storefront/claim-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchStorefrontData(slug);
  const name = data?.restaurant.name;
  const title = name ? `Reclamá ${name} | quiero.menu` : "Reclamar local | quiero.menu";
  const description = name
    ? `¿${name} es tu local? Reclamá la cuenta gratis y editá tu menú desde el celular.`
    : "Reclamá la cuenta de tu local y administrá tu menú digital gratis.";
  return {
    title: { absolute: title },
    description,
    // Página utilitaria: no compite en el índice.
    robots: { index: false, follow: false },
    // Sobrescribe el canonical/OG del layout de [slug] (heredarlos
    // apuntaría al storefront).
    alternates: { canonical: `https://quiero.menu/${slug}/reclamar` },
    openGraph: {
      title,
      description,
      url: `https://quiero.menu/${slug}/reclamar`,
      siteName: "quiero.menu",
      locale: "es_AR",
      type: "website",
    },
  };
}

export default async function ClaimPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (slug === "__dynamic__") notFound();
  const data = await fetchStorefrontData(slug);
  if (!data) notFound();

  const { restaurant } = data;
  const alreadyClaimed = restaurant.claimed !== false;

  return (
    <div className="min-h-screen bg-surface-container-lowest">
      <header className="border-b border-outline-variant/40">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-4">
          <Link
            href="/"
            className="font-[family-name:var(--font-heading)] text-lg font-extrabold text-on-surface"
          >
            quiero<span className="text-primary">.menu</span>
          </Link>
          <Link
            href={`/${slug}`}
            className="text-sm font-bold text-primary hover:underline"
          >
            ← Volver al menú
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-10 sm:py-14">
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-extrabold tracking-tight text-on-surface">
          Reclamá {restaurant.name}
        </h1>

        {alreadyClaimed ? (
          <div className="mt-6 rounded-2xl border border-outline-variant/40 bg-surface-container-low p-6">
            <p className="font-bold text-on-surface">
              Este menú ya lo gestiona su dueño.
            </p>
            <p className="mt-2 text-sm text-on-surface-variant">
              Si sos del local y perdiste el acceso, escribinos por WhatsApp y
              lo resolvemos.
            </p>
            <Link
              href={`/${slug}`}
              className="mt-4 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              Ver el menú
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-3 text-lg text-on-surface-variant">
              Publicamos tu menú para que la gente de tu ciudad lo encuentre.
              Si sos del local, te damos la cuenta gratis: lo editás vos desde
              el celular, recibís los pedidos y ves tus estadísticas.
            </p>
            <div className="mt-8">
              <ClaimForm slug={slug} />
            </div>
            <p className="mt-6 text-xs text-on-surface-variant">
              Después de pedirla, te escribimos por WhatsApp para verificar que
              sos del local. Sin tarjeta, sin compromiso.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
