import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'Perpus - Sederhana',
  description: 'Perpus Sederhana (Next.js + Express + MySQL)',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

