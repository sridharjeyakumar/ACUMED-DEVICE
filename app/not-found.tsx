'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6 px-4">
        <h1 className="text-6xl font-bold text-foreground">404</h1>
        <h2 className="text-2xl font-semibold text-foreground">Page Not Found</h2>
        <p className="text-muted-foreground max-w-md">
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/">
          <Button className="gap-2">
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}

