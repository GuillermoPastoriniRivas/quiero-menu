import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter, Poppins } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { RegisterSW } from "@/components/register-sw";
import { SentryInit } from "@/components/sentry-init";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-logo",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://quiero.menu"),
  title: {
    default: "Menu Digital Gratis para Restaurantes | quiero.menu",
    template: "%s | quiero.menu",
  },
  description: "Crea tu menu digital gratis, sin tarjeta. Recibi pedidos directos por WhatsApp o QR, sin comisiones por pedido.",
  keywords: [
    "menu digital gratis",
    "menu digital",
    "menu QR gratis",
    "carta digital gratis",
    "menu online restaurante",
    "pedidos por whatsapp",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Quiero",
  },
  applicationName: "Quiero",
  category: "BusinessApplication",
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://quiero.menu",
    siteName: "quiero.menu",
    title: "Menu Digital Gratis para Restaurantes | quiero.menu",
    description: "Crea tu menu digital gratis, sin tarjeta. Recibi pedidos directos por WhatsApp o QR, sin comisiones por pedido.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "quiero.menu - Menu digital gratis para restaurantes" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Menu Digital Gratis para Restaurantes | quiero.menu",
    description: "Crea tu menu digital gratis, sin tarjeta. Recibi pedidos directos por WhatsApp o QR, sin comisiones por pedido.",
    images: ["/og.png"],
  },
  icons: {
    icon: [{ url: "/icon-192.png", type: "image/png", sizes: "192x192" }, { url: "/icon.svg", type: "image/svg+xml", sizes: "any" }],
    apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR" className={`${plusJakartaSans.variable} ${inter.variable} ${poppins.variable} h-full antialiased`}>
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" sizes="any" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#E8532C" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Quiero" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- Material Symbols usa ejes variables (wght,FILL) que next/font no soporta */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <RegisterSW />
        <SentryInit />
        <Toaster />
      </body>
    </html>
  );
}
