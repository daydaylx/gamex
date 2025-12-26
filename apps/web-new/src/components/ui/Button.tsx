import { JSX } from 'preact';
import { clsx } from 'clsx';

export interface ButtonProps extends JSX.HTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  fullWidth = false,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'btn',
        {
          'btn-primary': variant === 'primary',
          'btn-danger': variant === 'danger',
          'btn-sm': size === 'sm',
          'btn-lg': size === 'lg',
          'btn-full': fullWidth,
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

