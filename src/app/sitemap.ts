import { getAllBlogs } from '@/server/blog';
import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllBlogs(false);
  const postUrls = posts.map<MetadataRoute.Sitemap[number]>((post) => ({
    url: `https://jun.codes/blog/${post.slug}`,
    lastModified: post.date,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  return [
    {
      url: 'https://jun.codes',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...postUrls,
  ];
}
