import { Badge } from '@/components/badge';
import { Heading } from '@/components/heading';
import { Section } from '@/components/section';
import { Text } from '@/components/text';
import { Title } from '@/components/title';
import { formatYearAndMonth } from '@/internationalization';
import { findAllJobs } from '@/server/job';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Career',
  description: 'A condensed version of my resume.',
  keywords: ['mats jun larsen', 'resume', 'career'],
};

export default async function WorkPage() {
  const jobs = await findAllJobs();
  return (
    <Section>
      <article>
        <Title>Career</Title>
        <Text constrained>
          Throughout my career, I have been lucky enough to work with a varied
          and diverse set of technologies, teams, and companies. This page is a
          condensed version of my resume, highlighting the most impactful
          experiences of my career.
        </Text>

        <div className="mt-4 lg:mt-8 flex flex-col gap-8">
          <article className="flex flex-col gap-4">
            <Heading>Experience</Heading>
            {jobs.map((job) => (
              <article
                key={job.slug}
                className="border border-gray-6 rounded-md shadow-xs p-2 flex flex-col gap-2"
              >
                <header className="flex gap-16 justify-between">
                  <h3 className="font-bold">
                    {job.metadata.title} <span className="font-normal">at</span>{' '}
                    {job.metadata.company}{' '}
                    <span className="font-normal text-gray-11">
                      (
                      {job.metadata.type !== 'full-time' &&
                        `${job.metadata.type}, `}
                      {job.metadata.location})
                    </span>
                  </h3>
                  <div>
                    <span>
                      <time dateTime={job.metadata.begin.toISOString()}>
                        {formatYearAndMonth(job.metadata.begin)} -{' '}
                      </time>
                      {job.metadata.end === 'present'
                        ? 'Present'
                        : formatYearAndMonth(job.metadata.end)}
                    </span>
                  </div>
                </header>

                <ul className="list-disc font-poppins">
                  {job.metadata.highlights.map((highlight) => (
                    <li key={highlight} className="ml-6">
                      {highlight}
                    </li>
                  ))}
                </ul>

                <hr className="border-0.5 border-gray-6 -mx-2" />

                <div className="flex gap-2 flex-wrap">
                  {job.metadata.skills.map((skill) => (
                    <Badge key={skill}>{skill}</Badge>
                  ))}
                </div>
              </article>
            ))}
          </article>
        </div>
      </article>

      <p className="text-gray-11 text-xs mt-4">
        Opinions are mine, and do not reflect the views of any current or past
        employer.
      </p>
    </Section>
  );
}
