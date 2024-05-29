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
};

export type PostFrontmatter = {
  title: string;
  description: string;
  date: string;
  tags: string[];
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
  };
}

export async function findPostBySlug(slug: string): Promise<Post | null> {
  const realpath = await fs.realpath(
    path.join(CONTENT_DIRECTORY, `${slug}.md`),
  );
  try {
    const stat = await fs.stat(realpath);
    if (stat.isFile() && !stat.isSymbolicLink()) {
      return getPost(realpath);
    }
    return null;
  } catch {
    return null;
  }
}

async function* findAllBlogs(): AsyncGenerator<Post> {
  const entries = await fs.readdir(CONTENT_DIRECTORY);
  for (const entry of entries) {
    const realpath = await fs.realpath(path.join(CONTENT_DIRECTORY, entry));
    const stat = await fs.stat(realpath);
    if (stat.isFile() && !stat.isSymbolicLink()) {
      yield getPost(realpath);
    }
  }
}

export async function getAllBlogs(): Promise<Post[]> {
  const items: Post[] = [];
  for await (const post of findAllBlogs()) {
    items.push(post);
  }
  return items;
}
