import { Grid } from '@/components/grid';
import { Section } from '@/components/section';
import Image from 'next/image';

export default function IndexPage() {
  return (
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
            people love. I'm currently pursing my Master's degree in informatics
            and artificial intelligence at the Norwegian University of Science
            and Technology.
          </p>
        </div>

        <div className="hidden lg:block lg:w-1/3">
          <Image
            src="/picture.png"
            alt="Photo of me"
            className="w-full h-auto rounded-md"
            width={808}
            height={741}
          />
        </div>
      </div>
    </Section>
  );
}
