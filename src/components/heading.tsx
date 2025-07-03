import { cn } from '@/classname';
import type { ComponentPropsWithoutRef, FC, PropsWithChildren } from 'react';

export type HeadingProps = {
  className?: string;
} & PropsWithChildren &
  ComponentPropsWithoutRef<'h2'>;

export const Heading: FC<HeadingProps> = ({
  className,
  children,
  ...props
}) => {
  const classes = cn('font-bold text-xl lg:text-2xl', className);
  return (
    <h2 className={classes} {...props}>
      {children}
    </h2>
  );
};
