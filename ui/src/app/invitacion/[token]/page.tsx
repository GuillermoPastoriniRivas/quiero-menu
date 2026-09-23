import type { Metadata } from "next";
import { InvitationView } from "@/components/invitation/invitation-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Tu local en quiero.menu" },
  description: "Entrá con tu cuenta y quedate con tu local en quiero.menu.",
  robots: { index: false, follow: false },
};

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <InvitationView token={token} />;
}
