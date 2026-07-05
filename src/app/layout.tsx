import type { Metadata } from "next";
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
  description: "Application de prise de rendez-vous chez des prestataires locaux : coiffeur, medecin, garagiste, esthetique, sport.",
  keywords: ["reservation", "rendez-vous", "prestataire", "coiffeur", "medecin", "garagiste", "ReservoExpress"],
  authors: [{ name: "ReservoExpress" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
