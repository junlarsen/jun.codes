import { Grid } from '@/components/grid';
import { Section } from '@/components/section';
import { getRelativeTime } from '@/internationalization';
import { getAllBlogs } from '@/server/blog';
import { differenceInDays } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type PageParams = {
  searchParams: {
    beta?: '1';
  };
};

export default async function IndexPage({ searchParams }: PageParams) {
  const posts = await getAllBlogs(searchParams.beta === '1');
  return (
    <>
      <Section>
        <Grid />
        <div className="flex w-full items-center gap-8">
          <div className="lg:w-2/3">
            <h1 className="font-bold text-2xl lg:text-4xl">
              Software, Open Source & Bouldering
            </h1>
            <p className="font-lato">
              I'm Mats, a software engineer, open-source developer, and student
              based in Trondheim, Norway. I have a passion for building software
              people love. I'm currently pursing my Master's degree in
              informatics and artificial intelligence at the Norwegian
              University of Science and Technology.
            </p>
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
          </div>
        </div>
      </Section>

      <Section>
        <h2 className="font-bold text-xl lg:text-2xl">
          {posts.length} post{posts.length === 1 ? '' : 's'}
        </h2>
        <p className="font-lato">
          I'm a firm believer in knowledge sharing, and occasionally write about
          software in my blog.
        </p>

        <div className="flex flex-col gap-4 mt-4">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="w-full p-2 border border-gray-6 rounded-md shadow-xs"
            >
              <h3 className="text-lg font-bold">{post.title}</h3>
              <p className="font-lato">{post.description}</p>
              <div className="flex flex-col lg:flex-row lg:gap-2">
                <p className="text-gray-11">
                  Posted {getRelativeTime(post.date)}
                </p>
                <span className="text-gray-11 hidden lg:block">|</span>
                <p className="text-gray-11">
                  {Number.parseInt(post.time.toString(10), 10)} minute read
                </p>
                <span className="text-gray-11  hidden lg:block">&mdash;</span>
                <div className="flex gap-2">
                  {post.tags.map((tag) => (
                    <span key={tag} className="text-brand-9">
                      {tag}
                    </span>
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
