import { Badge } from '@/components/badge';
import { Grid } from '@/components/grid';
import { Heading } from '@/components/heading';
import { Section } from '@/components/section';
import { Text } from '@/components/text';
import { Title } from '@/components/title';
import { formatDate, getRelativeTime } from '@/internationalization';
import { findAllBlogs } from '@/server/blog';
import Image from 'next/image';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type PageParams = {
  searchParams: {
    beta?: '1';
  };
};

export default async function IndexPage({ searchParams }: PageParams) {
  const posts = await findAllBlogs(searchParams.beta === '1');
  return (
    <>
      <Section>
        <Grid />
        <div className="flex w-full items-center gap-8">
          <div className="lg:w-2/3">
            <Title className="font-bold text-2xl lg:text-4xl">
              Software, Open Source, Travel & Bouldering
            </Title>
            <Text constrained>
              I'm Mats, a software engineer, open-source developer, and student
              based in Trondheim, Norway. I have a passion for building software
              people love. I'm currently pursing my Master's degree in
              informatics and artificial intelligence at the Norwegian
              University of Science and Technology.
            </Text>
            <address className="flex lg:hidden gap-2 items-center mt-2">
              <a
                href="https://linkedin.com/in/mats-jun-larsen"
                className="border border-gray-6 rounded-md p-1 bg-white"
              >
                <Image
                  src="/svg/linkedin.svg"
                  alt="LinkedIn"
                  width={24}
                  height={24}
                />
              </a>
              <a
                href="https://github.com/junlarsen"
                className="border border-gray-6 rounded-md p-1 bg-white"
              >
                <Image
                  src="/svg/github.svg"
                  alt="GitHub"
                  width={24}
                  height={24}
                />
              </a>
            </address>
          </div>

          <div className="hidden lg:block lg:w-1/3">
            <Image
              src="/picture.png"
              alt="Photo of me"
              className="w-full h-auto rounded-md"
              width={808}
              height={741}
              priority
            />
            <address className="gap-2 items-center mt-2 hidden lg:flex">
              <a
                href="https://linkedin.com/in/mats-jun-larsen"
                className="border border-gray-6 rounded-md p-1 bg-white"
              >
                <Image
                  src="/svg/linkedin.svg"
                  alt="LinkedIn"
                  width={24}
                  height={24}
                />
              </a>
              <a
                href="https://github.com/junlarsen"
                className="border border-gray-6 rounded-md p-1 bg-white"
              >
                <Image
                  src="/svg/github.svg"
                  alt="GitHub"
                  width={24}
                  height={24}
                />
              </a>
            </address>
          </div>
        </div>
      </Section>

      <Section>
        <header className="inline-flex gap-1">
          <Heading>
            {posts.length} post{posts.length === 1 ? '' : 's'}
          </Heading>
          <span className="self-center text-gray-11">&ndash;</span>
          <a href="/rss.xml" className="text-brand-9 self-center text-sm">
            rss feed
          </a>
        </header>
        <Text constrained>
          I firmly believe that the best way to understand is to teach. That's
          why I love to talk about programming, software, and technology. I
          occasionally write blog posts about things I find interesting, and I
          hope you find them interesting too.
        </Text>

        <div className="flex flex-col gap-4 mt-4">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="w-full p-2 border border-gray-6 rounded-md shadow-xs"
            >
              <h3 className="text-lg font-bold">{post.metadata.title}</h3>
              <p className="font-poppins">{post.metadata.description}</p>
              <hr className="border-0.5 border-gray-6 -mx-2 my-1" />
              <div className="flex flex-col lg:flex-row lg:gap-2">
                <time
                  dateTime={post.metadata.date.toISOString()}
                  className="text-gray-11"
                  title={formatDate(post.metadata.date)}
                >
                  Posted {getRelativeTime(post.metadata.date)}
                </time>
                <span className="text-gray-6 hidden lg:block">|</span>
                <p className="text-gray-11">
                  {Number.parseInt(post.metadata.readingTime.toString(10), 10)}{' '}
                  minute read
                </p>
                <span className="text-gray-6 hidden lg:block">|</span>
                <div className="flex gap-2">
                  {post.metadata.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
