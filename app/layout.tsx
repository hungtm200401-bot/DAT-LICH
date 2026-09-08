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
    <html lang="vi">
      <head>
        <link rel="stylesheet" href="/fonts/fonts.css" />
        <link rel="stylesheet" href="/styles.css" />
        <link rel="stylesheet" href="/couture.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
