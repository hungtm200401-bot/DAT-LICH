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
        <meta charSet="utf-8" />
        <meta name="hoan-build" content="location-auto-fill-1" />
        <script src="/client-bootstrap.js?v=5.7" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="HOÀN Admin" />
        <link rel="apple-touch-icon" href="/assets/hoan-logo.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preload" href="/fonts/hoan-5.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/tinos-Tinos-Regular.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
        <link rel="stylesheet" href="/fonts/fonts.css" />
        <link rel="stylesheet" href="/styles.css?v=2.5" />
        <link rel="stylesheet" href="/couture.css?v=137.0" />
        <link rel="stylesheet" href="/site-tools.css?v=146.0" />
        <link rel="stylesheet" href="/admin-refinements.css?v=8" />
        <link rel="stylesheet" href="/mobile-admin.css?v=1.2" />
        <link rel="stylesheet" href="/admin-interface.css?v=2" />
        <link rel="stylesheet" href="/location-experience.css?v=1.5" />
        <link rel="stylesheet" href="/admin-location.css?v=1.0" />
        <link rel="stylesheet" href="/finance-admin.css?v=1.0" />
        <link rel="stylesheet" href="/policy-navigation.css?v=1.0" />
      </head>
      <body suppressHydrationWarning>
        {children}
        {process.env.NODE_ENV !== "development" && <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(() => {});
            });
          }
        `}} />}
      </body>
    </html>
  );
}
