import { JSX } from 'preact';
import { clsx } from 'clsx';

export interface CardProps extends JSX.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
}

export function Card({ variant = 'default', className, children, ...props }: CardProps) {
  return (
    <div className={clsx('card', { [`card-${variant}`]: variant !== 'default' }, className)} {...props}>
      {children}
    </div>
  );
}

