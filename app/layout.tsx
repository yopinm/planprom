import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { RootShell } from "@/components/layout/RootShell";
import { CookieConsent } from "@/components/CookieConsent";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const facebookAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID?.trim();

export const metadata: Metadata = {
  title: "แพลนพร้อม",
  description:
    "เช็คลิสต์และแพลนเนอร์ PDF · ดาวน์โหลดทันที · ใช้ซ้ำตลอดกาล · เช็คทุกขั้น แพลนทุกวัน",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    apple: "/icon.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "แพลนพร้อม",
    description: "เช็คลิสต์และแพลนเนอร์ PDF พร้อมใช้ · ดาวน์โหลดทันที",
    url: "https://planprom.com",
    siteName: "แพลนพร้อม",
    locale: "th_TH",
    type: "website",
  },
  ...(facebookAppId
    ? {
        other: {
          "fb:app_id": facebookAppId,
        },
      }
    : {}),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-orange-50 font-sans">
        <RootShell>{children}</RootShell>
        <CookieConsent />
      </body>
    </html>
  );
}
