import type { Metadata } from 'next';
import { GuestGate } from '@/components/auth/guest-gate';
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';

export const metadata: Metadata = {
  title: { absolute: 'Creá tu cuenta | quiero.menu' },
  description: 'Creá tu menú digital gratis y empezá a recibir pedidos por WhatsApp.',
  robots: { index: false, follow: true },
};

export default function SignupPage() {
  return (
    <GuestGate>
      <OnboardingWizard entry="manual" />
    </GuestGate>
  );
}
