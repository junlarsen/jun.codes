import { cn } from '@/classname';
import type { ComponentPropsWithoutRef, FC, PropsWithChildren } from 'react';

export type TextProps = {
  constrained?: boolean;
  className?: string;
} & ComponentPropsWithoutRef<'p'> &
  PropsWithChildren;

export const Text: FC<TextProps> = ({
  constrained,
  className,
  children,
  ...props
}) => {
  const classes = cn(
    'text-lg font-poppins',
    constrained && 'max-w-[80ch]',
    className,
  );
  return (
    <p {...props} className={classes}>
      {children}
    </p>
  );
};
