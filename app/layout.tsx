import type { Metadata } from "next";
import "./globals.css";

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
        <link rel="stylesheet" href="/fonts/fonts.css" />
        <link rel="stylesheet" href="/styles.css?v=2.3" />
        <link rel="stylesheet" href="/couture.css?v=117.0" />
        <link rel="stylesheet" href="/site-tools.css?v=144.0" />
        <link rel="stylesheet" href="/admin-refinements.css?v=6" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
