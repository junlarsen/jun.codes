import { type Item, createCollection, withSort } from '@/server/collection';
import { z } from 'zod';

export type Job = Item<JobMetadata>;
export type JobMetadata = z.infer<typeof Job>;
const Job = z.object({
  title: z.string(),
  begin: z.coerce.date(),
  end: z.coerce.date().or(z.literal('present')),
  location: z.string(),
  company: z.string(),
  type: z.enum(['full-time', 'part-time', 'contract', 'internship']),
  highlights: z.array(z.string()),
  skills: z.array(z.string()),
});

const job = withSort(
  createCollection('jobs', Job),
  (a, b) => b.metadata.begin.getTime() - a.metadata.begin.getTime(),
);

export const findJobBySlug = job.findAll;
export const findAllJobs = job.findAll;
