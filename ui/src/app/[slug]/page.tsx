import { fetchStorefrontData } from "@/lib/storefront-data";
import { StorefrontClient } from "@/components/storefront/storefront-client";
import { StorefrontJsonLd } from "@/components/storefront/storefront-json-ld";

export default async function StorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Slug de fallback: dominios personalizados / slugs desconocidos. Lo resuelve
  // el cliente (por host o por path), como siempre.
  if (slug === "__dynamic__") {
    return <StorefrontClient slug="__dynamic__" initialData={null} />;
  }

  // SSR: contenido del menú en el HTML + JSON-LD. El cliente refetchea en mount
  // para tener isOpen/disponibilidad en vivo.
  const data = await fetchStorefrontData(slug);
  return (
    <>
      {data && <StorefrontJsonLd data={data} slug={slug} />}
      <StorefrontClient slug={slug} initialData={data} />
    </>
  );
}