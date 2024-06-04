import type { FC, PropsWithChildren } from 'react';

export const Badge: FC<PropsWithChildren> = ({ children }) => {
  return (
    <span className="bg-brand-3 text-brand-9 border rounded-md border-brand-6 px-1">
      {children}
    </span>
  );
};
