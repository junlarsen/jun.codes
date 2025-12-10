import RSS from 'rss';
import { findAllBlogs } from '@/server/blog';

export async function GET(): Promise<Response> {
  const rss = new RSS({
    title: 'Jun.codes',
    description: "Mats' blog & personal piece of the internet.",
    categories: ['Software Development'],
    site_url: 'https://jun.codes',
    feed_url: 'https://jun.codes/rss.xml',
    copyright: `© Mats Jun Larsen ${new Date().getFullYear()}`,
    language: 'en-US',
    image_url: 'https://jun.codes/snapshot.png',
    pubDate: new Date(),
    generator: 'Next.js',
    docs: 'https://www.rssboard.org/rss-specification',
  });
  for (const post of await findAllBlogs(false)) {
    rss.item({
      title: post.metadata.title,
      description: post.metadata.description,
      url: `https://jun.codes/blog/${post.slug}`,
      categories: post.metadata.tags,
      date: post.metadata.date,
      author: 'Mats Jun Larsen',
    });
  }
  return new globalThis.Response(rss.xml(), {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
