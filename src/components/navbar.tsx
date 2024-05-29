'use client';

import { cn } from '@/classname';
import * as RadixCollapsible from '@radix-ui/react-collapsible';
import { Cross1Icon, HamburgerMenuIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
import { type FC, useState } from 'react';

const APPLICATION_NAVBAR_ITEMS = [
  {
    label: 'Blog',
    href: '/blog',
  },
  {
    label: 'Open Source',
    href: '/oss',
  },
  {
    label: 'Work',
    href: '/work',
  },
];

export const Navbar: FC = () => {
  const [open, setOpen] = useState(false);

  const link = cn(
    'text-lg lg:text-xl font-fraunces text-black',
    'hover:text-brand-9 transition-colors duration-200',
  );
  return (
    <RadixCollapsible.Root open={open} onOpenChange={setOpen}>
      <nav className="w-full mx-auto max-w-screen-lg p-4 lg:p-8 flex justify-between">
        <Link href="/" className={cn(link, 'text-xl')}>
          Mats Jun Larsen
        </Link>
        <ul className="hidden lg:flex gap-4">
          {APPLICATION_NAVBAR_ITEMS.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={link}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <RadixCollapsible.Trigger className="lg:hidden transition ease-in-out duration-200 transition-transform">
          {open ? <Cross1Icon /> : <HamburgerMenuIcon />}
        </RadixCollapsible.Trigger>
      </nav>

      <RadixCollapsible.Content className="px-4 -mt-4 border-b border-gray-300">
        <ul className="flex flex-col">
          {APPLICATION_NAVBAR_ITEMS.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={link}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </RadixCollapsible.Content>
    </RadixCollapsible.Root>
  );
};
