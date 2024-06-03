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
import type { z } from 'zod';

const pipeline = unified()
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

export type Item<TMetadata> = {
  content: string;
  slug: string;
  metadata: TMetadata & {
    readingTime: number;
  };
};

export interface Collection<TItem> {
  findAll(): Promise<Item<TItem>[]>;
  findBySlug(slug: string): Promise<Item<TItem> | null>;
}

const CONTENT_DIRECTORY = path.join(process.cwd(), 'src/content');

export function createCollection<TMetadata>(
  directory: string,
  parser: z.ZodSchema<TMetadata>,
): Collection<TMetadata> {
  const collectionDirectory = path.join(CONTENT_DIRECTORY, directory);
  const getCollectionItem = async (
    realpath: string,
  ): Promise<Item<TMetadata>> => {
    const content = await fs.readFile(realpath, 'utf-8');
    const result = await pipeline.process(content);
    const output = parser.safeParse(result.data.frontmatter);
    if (!output.success) {
      console.error('Invalid metadata for input', result.data.frontmatter);
      throw new Error('Invalid metadata');
    }
    const metadata = output.data;
    const slug = path.basename(realpath, path.extname(realpath));
    const html = result.toString();
    return {
      content: html,
      slug,
      metadata: {
        ...metadata,
        readingTime: readingTime(html).minutes,
      },
    };
  };

  return {
    async findBySlug(slug: string): Promise<Item<TMetadata> | null> {
      const realpath = path.join(collectionDirectory, `${slug}.md`);
      try {
        const stat = await fs.stat(realpath);
        if (stat.isFile() && !stat.isSymbolicLink()) {
          return await getCollectionItem(realpath);
        }
        return null;
      } catch {
        return null;
      }
    },
    async findAll(): Promise<Item<TMetadata>[]> {
      async function* generator(): AsyncGenerator<Item<TMetadata>> {
        const entries = await fs.readdir(collectionDirectory);
        for (const entry of entries) {
          const realpath = path.join(collectionDirectory, entry);
          const stat = await fs.stat(realpath);
          if (stat.isFile() && !stat.isSymbolicLink()) {
            yield await getCollectionItem(realpath);
          }
        }
      }
      const items: Item<TMetadata>[] = [];
      for await (const item of generator()) {
        items.push(item);
      }
      return items;
    },
  };
}

export const withSort = <T>(
  collection: Collection<T>,
  sortFn: (a: Item<T>, b: Item<T>) => number,
): Collection<T> => {
  return {
    ...collection,
    async findAll(): Promise<Item<T>[]> {
      const items = await collection.findAll();
      return items.sort(sortFn);
    },
  };
};
