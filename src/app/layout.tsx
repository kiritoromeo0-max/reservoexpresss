import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ReservoExpress - Reservez un creneau en 3 taps",
  description:
    "Application de prise de rendez-vous en Cote d'Ivoire : coiffeur, medecin, garagiste, esthetique, sport. Reservez en 3 taps.",
  keywords: [
    "reservation",
    "rendez-vous",
    "Cote d'Ivoire",
    "Abidjan",
    "coiffeur",
    "medecin",
    "garagiste",
    "ReservoExpress",
  ],
  authors: [{ name: "ReservoExpress" }],
  manifest: "/manifest.json",
  applicationName: "ReservoExpress",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ReservoExpress",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-384.png", sizes: "384x384", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "ReservoExpress",
    description: "Reservez un creneau chez un prestataire local en 3 taps.",
    siteName: "ReservoExpress",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ReservoExpress",
    description: "Reservez un creneau chez un prestataire local en 3 taps.",
  },
};

export const viewport: Viewport = {
  themeColor: "#f59e0b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
