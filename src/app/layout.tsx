import type { ReactNode } from "react";
import type { Metadata } from "next";

import { ToastProvider } from "@/components/ui/toast";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Helped By Dinda | Platform Bimbingan Belajar Modern",
    template: "%s | Helped By Dinda",
  },
  description: "Platform bimbel digital modern yang menghubungkan Admin, Pengajar, dan Murid dengan absensi digital, materi interaktif, rekap fee otomatis, dan pembayaran Midtrans terintegrasi.",
  keywords: ["bimbel online", "les privat", "Helped By Dinda", "tutor matematika", "UTBK", "belajar online"],
  icons: {
    icon: [
      { rel: "icon", url: "/public/helpedd.jpeg" },
      { rel: "icon", url: "/public/helpedd.jpeg", sizes: "16x16" },
      { rel: "icon", url: "/public/helpedd.jpeg", sizes: "32x32" },
    ],
    apple: [{ rel: "apple-touch-icon", url: "/public/helpedd.jpeg", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
