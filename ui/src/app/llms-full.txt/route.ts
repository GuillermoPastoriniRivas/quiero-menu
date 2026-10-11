import { guidesPlainText } from "@/lib/public-guides";

export const dynamic = "force-static";

export function GET() {
  const text = [
    "# quiero.menu — información pública y guías",
    "La publicación de la carta es gratuita. Las funciones y límites de pedidos dependen del plan. Planes vigentes: https://quiero.menu/#precios",
    "Directorio: https://quiero.menu/locales. Las fichas sin dueño son informativas; no tienen pedidos habilitados. No todos los locales publican menú, precios u horarios.",
    "URLs de país/región/ciudad/rubro: https://quiero.menu/en/{pais}/{region}/{ciudad}/{rubro}. Solo se publican cuando hay locales. URLs disponibles: https://quiero.menu/sitemap.xml",
    "Cada negocio público tiene una ficha o carta en https://quiero.menu/{slug}. Los datos y la disponibilidad deben comprobarse en esa página.",
    guidesPlainText(),
  ].join("\n\n");
  return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
