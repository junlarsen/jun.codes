import { findPostBySlug } from '@/server/blog';
import { notFound } from 'next/navigation';

type PageParams = {
  params: {
    slug: string;
  };
};

export default async function BlogPostPage({ params }: PageParams) {
  const post = await findPostBySlug(params.slug);
  if (post === null) {
    return notFound();
  }

  return <pre>{JSON.stringify(post)}</pre>;
}
