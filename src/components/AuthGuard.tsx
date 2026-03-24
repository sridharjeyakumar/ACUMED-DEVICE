'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        if (pathname === '/login') {
            setChecked(true);
            return;
        }
        if (!isAuthenticated()) {
            router.replace('/login');
        } else {
            setChecked(true);
        }
    }, [pathname, router]);

    if (!checked && pathname !== '/login') return null;

    return <>{children}</>;
}
