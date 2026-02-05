import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryProvider } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ACUMED DEVICES - Production Inventory',
  description: 'Production Inventory Management System',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ReactQueryProvider>
          <TooltipProvider>
            {children}
            <Toaster />
            <Sonner />
            {/* App Version Overlay */}
            <div className="fixed bottom-0 left-0 z-50 p-3 pointer-events-none">
              <div className="bg-gray-200/60 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm">
                <span className="text-xs font-medium text-gray-600">
                  APP VERSION <span className="font-bold text-gray-900">0.1.2</span>
                </span>
              </div>
            </div>
          </TooltipProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}

