import type { Metadata } from 'next';
import { Fraunces, Poppins } from 'next/font/google';
import './globals.css';
import 'katex/dist/katex.css';
import { cn } from '@/classname';
import { Navbar } from '@/components/navbar';
import type { PropsWithChildren } from 'react';

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-fraunces',
});
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://jun.codes/'),
  title: 'Jun.codes',
  description: "Mats' blog & personal piece of the internet.",
  category: 'Software Development',
  keywords: ['mats jun larsen', 'blog', 'software development'],
  openGraph: {
    title: 'Jun.codes',
    description: "Mats' blog & personal piece of the internet.",
    type: 'website',
    siteName: 'Jun.codes',
    url: 'https://jun.codes',
    countryName: 'Norway',
    locale: 'en-US',
    images: [
      {
        url: '/snapshot.png',
      },
    ],
  },
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/favicon.png',
    other: [
      {
        rel: 'apple-touch-icon',
        sizes: '120x120',
        url: '/apple-touch-icon.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        url: '/favicon-32x32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        url: '/favicon-16x16.png',
      },
    ],
  },
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" dir="ltr">
      <body
        className={cn(
          fraunces.variable,
          poppins.variable,
          'bg-gray-1 font-fraunces',
        )}
      >
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
