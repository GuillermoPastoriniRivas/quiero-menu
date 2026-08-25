import type { Metadata } from "next";
import { getStorefrontIndex } from "@/lib/storefront-index";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  // Slug de fallback (dominios personalizados, slugs desconocidos): no indexar.
  if (slug === "__dynamic__") {
    return {
      title: "Menu digital",
      robots: { index: false, follow: false },
    };
  }

  const index = await getStorefrontIndex();
  const entry = index.find((e) => e.slug === slug);
  if (!entry) {
    return {
      title: "Menu digital",
      robots: { index: false, follow: false },
    };
  }

  const url = `https://quiero.menu/${slug}`;
  // Título de pestaña: solo el nombre del local. El título social (OG/Twitter)
  // queda descriptivo para que la preview compartida explique el menú.
  const socialTitle = entry.city
    ? `Menú de ${entry.name} en ${entry.city} | quiero.menu`
    : `Menú de ${entry.name} | quiero.menu`;
  const description =
    entry.description?.trim() ||
    `Mirá el menú de ${entry.name}${entry.city ? ` en ${entry.city}` : ""} y pedí directo, sin comisiones.`;
  const image = entry.logoUrl || entry.bannerUrl || undefined;

  return {
    title: { absolute: entry.name },
    description,
    alternates: { canonical: url },
    keywords: ["menú digital", entry.name, ...(entry.city ? [entry.city] : [])],
    icons: {
      icon: entry.logoUrl
        ? [{ url: entry.logoUrl, type: "image/png", sizes: "any" }]
        : undefined,
    },
    openGraph: {
      title: socialTitle,
      description,
      url,
      siteName: "quiero.menu",
      locale: "es_AR",
      type: "website",
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}