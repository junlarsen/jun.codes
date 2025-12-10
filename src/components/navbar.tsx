'use client';

import Link from 'next/link';
import type { FC } from 'react';
import { cn } from '@/classname';

export const Navbar: FC = () => {
  const link = cn(
    'text-lg lg:text-xl font-fraunces text-black',
    'hover:text-brand-9 transition-colors duration-100 ease-in-out',
  );
  return (
    <nav className="w-full mx-auto max-w-(--breakpoint-lg) p-4 lg:p-8 flex justify-between">
      <Link href="/" className={cn(link, 'text-xl')}>
        Mats Jun Larsen
      </Link>
    </nav>
  );
};
