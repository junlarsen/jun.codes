import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/badge';
import { Heading } from '@/components/heading';
import { Section } from '@/components/section';
import { Text } from '@/components/text';
import { Title } from '@/components/title';
import { formatDate, getRelativeTime } from '@/internationalization';
import { findAllBlogs } from '@/server/blog';

export const dynamic = 'force-dynamic';

type PageParams = {
  searchParams: Promise<{
    beta?: '1';
  }>;
};

export default async function IndexPage(props: PageParams) {
  const searchParams = await props.searchParams;
  const posts = await findAllBlogs(searchParams.beta === '1');
  return (
    <>
      <Section>
        <div className="flex w-full items-center gap-8">
          <div className="lg:w-2/3">
            <Title className="font-bold text-2xl lg:text-4xl">
              Software engineer & cloud enthusiast
            </Title>
            <Text constrained className="mt-4">
              Hello! 👋 I'm Mats Jun Larsen, a software engineer, cloud
              enthusiast, and student at NTNU & UTokyo. I am deeply passionate
              about cloud computing, compiler technology, and large-scale
              software. I'm currently pursing my Master's degree in Informatics
              and AI.
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
                className="border border-gray-6 rounded-md p-1 bg-white hover:bg-gray-3 transition-colors duration-100 ease-in-out"
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
                className="border border-gray-6 rounded-md p-1 bg-white hover:bg-gray-3 transition-colors duration-100 ease-in-out"
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
          I'm a hands-on software engineer and I firmly believe in learning
          through sharing. My blog has posts about cloud-native technologies,
          software engineering, and open-source.
        </Text>

        <div className="flex flex-col gap-4 mt-4">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="w-full p-2 border border-gray-6 rounded-md shadow-2xs hover:bg-gray-3 transition-colors duration-100 ease-in-out"
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
