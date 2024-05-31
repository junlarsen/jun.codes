import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import rehypeShiki from '@shikijs/rehype';
import readingTime from 'reading-time';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import remarkParseFrontmatter from 'remark-parse-frontmatter';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

const CONTENT_DIRECTORY = path.join(process.cwd(), 'src/content');

export type Post = {
  title: string;
  description: string;
  slug: string;
  date: Date;
  time: number;
  content: string;
  tags: string[];
  published: boolean;
};

export type PostFrontmatter = {
  title: string;
  description: string;
  date: string;
  tags: string[];
  published: boolean;
};

const chain = unified()
  .use(remarkParse)
  .use(remarkFrontmatter, ['yaml'])
  .use(remarkParseFrontmatter)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkRehype)
  .use(rehypeKatex)
  .use(rehypeShiki, {
    theme: 'github-light',
    langs: [
      'typescript',
      'json',
      'rust',
      'kotlin',
      'latex',
      'zsh',
      'terraform',
      'java',
      'diff',
    ],
  })
  .use(rehypeSlug)
  .use(rehypeStringify);

async function getPost(realpath: string): Promise<Post> {
  const content = await fs.readFile(realpath);
  const result = await chain.process(content);
  const frontmatter = result.data.frontmatter as PostFrontmatter;
  const date = new Date(frontmatter.date);
  const slug = path.basename(realpath).replace(/\.md$/, '');
  const html = result.toString();

  return {
    title: frontmatter.title,
    description: frontmatter.description,
    slug,
    date,
    time: readingTime(html).minutes,
    content: html,
    tags: frontmatter.tags,
    published: frontmatter.published,
  };
}

export async function findPostBySlug(
  slug: string,
  withUnpublished: boolean,
): Promise<Post | null> {
  const realpath = await fs.realpath(
    path.join(CONTENT_DIRECTORY, `${slug}.md`),
  );
  try {
    const stat = await fs.stat(realpath);
    if (stat.isFile() && !stat.isSymbolicLink()) {
      const post = await getPost(realpath);
      if (post.published || withUnpublished) {
        return post;
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function* findAllBlogs(withUnpublished: boolean): AsyncGenerator<Post> {
  const entries = await fs.readdir(CONTENT_DIRECTORY);
  for (const entry of entries) {
    const realpath = await fs.realpath(path.join(CONTENT_DIRECTORY, entry));
    const stat = await fs.stat(realpath);
    if (stat.isFile() && !stat.isSymbolicLink()) {
      const post = await getPost(realpath);
      if (post.published || withUnpublished) {
        yield post;
      }
    }
  }
}

export async function getAllBlogs(withUnpublished: boolean): Promise<Post[]> {
  const items: Post[] = [];
  for await (const post of findAllBlogs(withUnpublished)) {
    items.push(post);
  }
  return items.toSorted((a, b) => b.date.getUTCMilliseconds() - a.date.getUTCMilliseconds());
}
