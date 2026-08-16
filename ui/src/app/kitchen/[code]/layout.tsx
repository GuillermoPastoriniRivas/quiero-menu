export function generateStaticParams() {
  return [{ code: '__dynamic__' }];
}

export default function KitchenLayout({ children }: { children: React.ReactNode }) {
  return children;
}
