import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from "@/components/ui/toaster";
import { initializeDatabase } from '@/lib/db-init';

const inter = Inter({ subsets: ['latin'] });

// Initialize database
initializeDatabase().catch(console.error);

export const metadata: Metadata = {
  title: 'Profitedge - Investment Platform',
  description: 'Secure crypto investment platform with referral bonuses',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-background`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}