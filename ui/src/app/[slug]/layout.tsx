export function generateStaticParams() {
  return [{ slug: '__dynamic__' }];
}

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return children;
}
