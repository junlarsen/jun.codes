import type { FC, PropsWithChildren } from 'react';

export const Section: FC<PropsWithChildren> = ({ children }) => {
  return (
    <section className="max-w-(--breakpoint-lg) px-4 pt-8 lg:px-8 lg:py-16 mx-auto">
      {children}
    </section>
  );
};
