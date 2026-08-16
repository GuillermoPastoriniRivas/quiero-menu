export function generateStaticParams() {
  return [{ code: '__dynamic__' }];
}

export default function DeliveryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
