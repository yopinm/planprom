import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { RootShell } from "@/components/layout/RootShell";

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
  title: "คูปองคุ้ม — คูปองและเปรียบราคาสินค้า",
  description:
    "ค้นหาคูปองและเปรียบราคาสินค้าออนไลน์จาก Shopee, Lazada และอื่น ๆ ได้ที่คูปองคุ้ม",
  icons: {
    icon: "/favicon.ico",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "คูปองคุ้ม",
    description: "ค้นหาคูปองและเปรียบราคาสินค้าออนไลน์",
    url: "https://couponkum.com",
    siteName: "คูปองคุ้ม",
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
      </body>
    </html>
  );
}
