import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'StockPilot Head Admin',
  description: 'Head of Admins dashboard for StockPilot',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0B0B0F] text-[#E6E6EA]">
        {children}
      </body>
    </html>
  );
}
