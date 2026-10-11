import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PUBLIC_GUIDES, getPublicGuide } from "@/lib/public-guides";
import { serializeJsonLd } from "@/lib/json-ld";
import { DirectoryBreadcrumbs } from "@/components/directory/directory-breadcrumbs";
import { BreadcrumbsJsonLd } from "@/components/directory/directory-json-ld";

export const dynamicParams = false;
export function generateStaticParams() { return PUBLIC_GUIDES.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const guide = getPublicGuide((await params).slug);
  if (!guide) return {};
  const url = `https://quiero.menu/guias/${guide.slug}`;
  return {
    title: guide.title, description: guide.description, alternates: { canonical: url },
    openGraph: { title: guide.title, description: guide.description, url, type: "article", modifiedTime: guide.updatedAt, images: [{ url: "https://quiero.menu/locales/opengraph-image", width: 1200, height: 630 }] },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const guide = getPublicGuide((await params).slug);
  if (!guide) notFound();
  const url = `https://quiero.menu/guias/${guide.slug}`;
  const breadcrumbs = [{ name: "quiero.menu", url: "https://quiero.menu" }, { name: "Guías", url: "https://quiero.menu/guias" }, { name: guide.title, url }];
  return (
    <>
      <BreadcrumbsJsonLd items={breadcrumbs} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd({
        "@context": "https://schema.org", "@type": "Article", headline: guide.title, description: guide.description,
        mainEntityOfPage: url, datePublished: guide.updatedAt, dateModified: guide.updatedAt,
        author: { "@type": "Organization", name: "quiero.menu", url: "https://quiero.menu" },
      }) }} />
      <DirectoryBreadcrumbs items={breadcrumbs} />
      <article className="max-w-3xl">
        <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">{guide.title}</h1>
        <p className="mt-4 text-lg text-on-surface-variant">{guide.description}</p>
        <p className="mt-3 text-xs text-on-surface-variant">Actualizado: <time dateTime={guide.updatedAt}>{guide.updatedAt.split('-').reverse().join('/')}</time> · Equipo de quiero.menu</p>
        {guide.sections.map((section) => (
          <section key={section.title} className="mt-10">
            <h2 className="text-2xl font-bold">{section.title}</h2>
            {section.paragraphs.map((paragraph) => <p key={paragraph} className="mt-4 leading-7 text-on-surface-variant">{paragraph}</p>)}
            {section.items && <ul className="mt-4 list-disc space-y-2 pl-6 text-on-surface-variant">{section.items.map((item) => <li key={item}>{item}</li>)}</ul>}
          </section>
        ))}
      </article>
      <section className="mt-12 rounded-2xl bg-surface-container-low p-6">
        <h2 className="text-xl font-bold">Publicá la carta de tu local</h2>
        <p className="mt-2 text-on-surface-variant">Creá tu cuenta y revisá tu menú antes de compartir el enlace o el QR con tus clientes.</p>
        <Link href="/signup" className="mt-4 inline-block rounded-full bg-primary px-5 py-3 text-sm font-bold text-white">Crear mi menú gratis</Link>
        <Link href="/#precios" className="ml-5 inline-block text-sm font-semibold text-primary">Ver planes vigentes</Link>
      </section>
      <nav aria-label="Guías relacionadas" className="mt-10 space-y-3">
        <h2 className="text-lg font-bold">Seguí leyendo</h2>
        {PUBLIC_GUIDES.filter((other) => other.slug !== guide.slug).map((other) => <Link key={other.slug} href={`/guias/${other.slug}`} className="block text-primary hover:underline">{other.title}</Link>)}
      </nav>
    </>
  );
}
