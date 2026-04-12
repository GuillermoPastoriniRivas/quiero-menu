import { notFound } from 'next/navigation';
import type { StorefrontData } from '@/types';
import { StorefrontView } from '@/components/storefront/storefront-view';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

async function getStorefront(slug: string): Promise<StorefrontData | null> {
  try {
    const res = await fetch(`${API_URL}/storefront/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getStorefront(slug);
  if (!data) return { title: 'Restaurante no encontrado' };
  return {
    title: `${data.restaurant.name} - quiero.menu`,
    description: data.restaurant.description || `Menú digital de ${data.restaurant.name}`,
  };
}

export default async function StorefrontPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getStorefront(slug);
  if (!data) notFound();
  return <StorefrontView data={data} slug={slug} />;
}
