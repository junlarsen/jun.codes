import type { ComponentPropsWithoutRef, FC, PropsWithChildren } from 'react';
import { cn } from '@/classname';

export type TitleProps = {
  className?: string;
} & PropsWithChildren &
  ComponentPropsWithoutRef<'h1'>;

export const Title: FC<TitleProps> = ({ className, children, ...props }) => {
  const classes = cn('font-bold text-2xl lg:text-4xl', className);
  return (
    <h1 {...props} className={classes}>
      {children}
    </h1>
  );
};
