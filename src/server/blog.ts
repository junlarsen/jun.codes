import { z } from 'zod';
import {
  type Collection,
  createCollection,
  type Item,
  withSort,
} from '@/server/collection';

export type Post = Item<PostMetadata>;
export type PostMetadata = z.infer<typeof Post>;
const Post = z.object({
  title: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  published: z.boolean(),
  date: z.coerce.date(),
});

const blog: Collection<PostMetadata> = withSort(
  createCollection('blog', Post),
  (a, b) => b.metadata.date.getTime() - a.metadata.date.getTime(),
);

export const findBlogBySlug = async (
  slug: string,
  withUnpublished: boolean,
) => {
  const item = await blog.findBySlug(slug);
  if (item && (item.metadata.published || withUnpublished)) {
    return item;
  }
  return null;
};

export const findAllBlogs = async (withUnpublished: boolean) => {
  const items = await blog.findAll();
  return items.filter((item) => item.metadata.published || withUnpublished);
};
