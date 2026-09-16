import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0d1111",
};

export const metadata: Metadata = {
  title: "HOÀN — Makeup Artist",
  description: "Đặt lịch trang điểm cá nhân hóa cùng HOÀN Makeup Artist.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="HOÀN Admin" />
        <link rel="apple-touch-icon" href="/assets/hoan-logo.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="stylesheet" href="/fonts/fonts.css" />
        <link rel="stylesheet" href="/styles.css?v=2.3" />
        <link rel="stylesheet" href="/couture.css?v=117.0" />
        <link rel="stylesheet" href="/site-tools.css?v=144.0" />
        <link rel="stylesheet" href="/admin-refinements.css?v=7" />
        <link rel="stylesheet" href="/mobile-admin.css?v=1.1" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
