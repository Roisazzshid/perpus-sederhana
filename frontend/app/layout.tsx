import './globals.css';

// Minimal local Metadata type to avoid dependency on 'next' types
type Metadata = {
  title?: string;
  description?: string;
};

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

