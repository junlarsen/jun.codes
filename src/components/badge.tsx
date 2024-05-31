import type { FC, PropsWithChildren } from 'react';

export const Badge: FC<PropsWithChildren> = ({ children }) => {
  return (
    <span className="text-brand-9 border rounded-md border-brand-6 px-1">
      {children}
    </span>
  );
};
