import { cn } from '@/classname';
import { Badge } from '@/components/badge';
import { Section } from '@/components/section';
import { formatDate } from '@/internationalization';
import { findPostBySlug } from '@/server/blog';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

type PageParams = {
  params: {
    slug: string;
  };
};

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const post = await findPostBySlug(params.slug, true);
  if (post === null) {
    return notFound();
  }
  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://jun.codes/blog/${post.slug}`,
      tags: post.tags,
      type: 'article',
      authors: ['Mats Jun Larsen'],
      locale: 'en-US',
      publishedTime: post.date.toISOString(),
    },
  };
}

export default async function BlogPostPage({ params }: PageParams) {
  const post = await findPostBySlug(params.slug, true);
  if (post === null) {
    return notFound();
  }

  const classes = cn(
    'prose text-black',
    'prose-p:font-poppins prose-p:my-6 prose-p:text-gray-12',
    'prose-headings:mt-2 prose-headings:-mb-4',
    'prose-pre:border prose-pre:border-gray-6 rounded-md shadow:xs',
    'prose-a:text-brand-9 prose-a:underline prose-a:my-0',
  );
  const time = Number.parseInt(post.time.toString(10), 10);

  return (
    <Section>
      <article>
        <span className="text-gray-11">{time} minute read</span>
        <h1 className="mb-2 text-3xl lg:text-4xl font-bold">{post.title}</h1>
        <p className="text-lg">{post.description}</p>
        <hr className="my-2 border-gray-6" />
        <div className="w-full flex justify-between gap-8">
          <time
            dateTime={post.date.toISOString()}
            className="text-gray-11"
            title={formatDate(post.date)}
          >
            Published on {post.date.toDateString()}
          </time>
          <div className="flex gap-2">
            <span className="text-gray-11">in </span>
            {post.tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        </div>

        <div
          // biome-ignore lint/security/noDangerouslySetInnerHtml: safe, as content is authored by me
          dangerouslySetInnerHTML={{ __html: post.content }}
          className={cn(classes, 'mt-4')}
        />

        <p className="text-gray-11 text-xs">
          Blog content licensed under CC-BY-4.0.
        </p>
      </article>
    </Section>
  );
}
