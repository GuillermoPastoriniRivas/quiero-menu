export function generateStaticParams() {
  return [{ code: '__dynamic__' }];
}

export default function TrackingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
