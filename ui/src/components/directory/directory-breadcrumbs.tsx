import Link from "next/link";

export type DirectoryCrumb = { name: string; url: string };

export function DirectoryBreadcrumbs({ items }: { items: DirectoryCrumb[] }) {
  return (
    <nav aria-label="Ruta de navegación" className="mb-6 text-xs text-on-surface-variant">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, i) => (
          <li key={item.url} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden="true">/</span>}
            {i === items.length - 1 ? (
              <span aria-current="page">{item.name}</span>
            ) : (
              <Link href={item.url.replace("https://quiero.menu", "") || "/"} className="hover:text-primary hover:underline">{item.name}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
