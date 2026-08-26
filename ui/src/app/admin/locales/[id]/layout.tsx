export function generateStaticParams() {
  return [{ id: '__dynamic__' }];
}

export default function AdminLocaleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
