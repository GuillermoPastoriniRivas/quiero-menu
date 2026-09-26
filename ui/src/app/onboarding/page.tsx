import type { Metadata } from 'next';
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';

export const metadata: Metadata = {
  title: { absolute: 'Armá tu menú con una foto | quiero.menu' },
  description: 'Sacale una foto a tu carta y en un minuto tenés tu menú digital con pedidos por WhatsApp. Gratis.',
  robots: { index: false, follow: true },
};

export default function OnboardingPage() {
  return <OnboardingWizard entry="photo" />;
}
