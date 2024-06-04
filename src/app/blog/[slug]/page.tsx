import { cn } from '@/classname';
import { Badge } from '@/components/badge';
import { Section } from '@/components/section';
import { formatDate } from '@/internationalization';
import { findBlogBySlug } from '@/server/blog';
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
  const post = await findBlogBySlug(params.slug, true);
  if (post === null) {
    return notFound();
  }
  return {
    title: post.metadata.title,
    description: post.metadata.description,
    keywords: post.metadata.tags.concat(['mats jun larsen', 'blog']),
    openGraph: {
      title: post.metadata.title,
      description: post.metadata.description,
      url: `https://jun.codes/blog/${post.slug}`,
      tags: post.metadata.tags,
      type: 'article',
      authors: ['Mats Jun Larsen'],
      locale: 'en-US',
      publishedTime: post.metadata.date.toISOString(),
    },
  };
}

export default async function BlogPostPage({ params }: PageParams) {
  const post = await findBlogBySlug(params.slug, true);
  if (post === null) {
    return notFound();
  }

  const classes = cn(
    'prose text-black',
    'prose-p:font-poppins prose-p:my-6 prose-p:text-gray-12',
    'prose-headings:mt-2 prose-headings:-mb-4',
    'prose-pre:border prose-pre:border-gray-6 rounded-md shadow:xs',
    'prose-a:text-brand-9 prose-a:underline prose-a:my-0',
    'prose-blockquote:text-gray-12 prose-blockquote:border-gray-6',
  );
  const time = Number.parseInt(post.metadata.readingTime.toString(10), 10);

  return (
    <Section>
      <article>
        <span className="text-gray-11">{time} minute read</span>
        <h1 className="mb-2 text-2xl lg:text-4xl font-bold">
          {post.metadata.title}
        </h1>
        <p className="text-lg">{post.metadata.description}</p>
        <hr className="my-2 border-gray-6" />
        <div className="w-full flex justify-between gap-8">
          <time
            dateTime={post.metadata.date.toISOString()}
            className="text-gray-11"
            title={formatDate(post.metadata.date)}
          >
            Published on {post.metadata.date.toDateString()}
          </time>
          <div className="flex gap-2 flex-wrap">
            <span className="text-gray-11">in </span>
            {post.metadata.tags.map((tag) => (
              <div key={tag} className="flex-start">
                <Badge key={tag}>{tag}</Badge>
              </div>
            ))}
          </div>
        </div>

        <div
          // biome-ignore lint/security/noDangerouslySetInnerHtml: safe, as content is authored by me
          dangerouslySetInnerHTML={{ __html: post.content }}
          className={cn(classes, 'mt-4')}
        />

        <p className="text-gray-11 text-xs">
          Blog content licensed under CC BY-NC-SA 4.0 DEED.
        </p>
      </article>
    </Section>
  );
}
