import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Menu digital',
  robots: {
    index: false,
    follow: false,
  },
};

export function generateStaticParams() {
  return [{ slug: '__dynamic__' }];
}

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return children;
}
