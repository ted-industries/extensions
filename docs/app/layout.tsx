import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <title>ted extensions</title>
        <meta name="description" content="Browse and install extensions for the ted code editor" />
      </head>
      <body className="flex flex-col min-h-screen bg-black text-white antialiased">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
