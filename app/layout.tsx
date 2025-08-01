import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ToastProvider } from "@/shared/components/ui/toast-provider";
import QueryProvider from "@/shared/providers/QueryProvider";
import Header from "@/shared/components/layout/Header";
import DataInitializer from "@/shared/components/DataInitializer";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sky Hostel",
  description:
    "Stay, explore, and make memories. The Ultimate Hostel Experience Awaits",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://remitademo.net/payment/v1/remita-pay-inline.bundle.js"
          strategy="afterInteractive"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <QueryProvider>
          <DataInitializer>
            <Header />
            <main>{children}</main>
            <ToastProvider />
          </DataInitializer>
        </QueryProvider>
      </body>
    </html>
  );
}
