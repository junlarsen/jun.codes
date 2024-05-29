import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Jun.codes',
    short_name: 'Jun.codes',
    description: "Mats' blog & personal piece of the internet.",
    start_url: '/',
    display: 'standalone',
    theme_color: '#E5484D',
    background_color: '#FDFCFD',
    dir: 'ltr',
    categories: ['Software Development'],
    lang: 'en-US',
    screenshots: [
      {
        src: '/snapshot.png',
        type: 'image/png',
        sizes: '2102x1266',
      },
    ],
    icons: [
      {
        src: '/favicon.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '120x120',
        type: 'image/png',
      },
      {
        src: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
    ],
  };
}
