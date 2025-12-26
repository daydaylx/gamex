import { JSX } from 'preact';
import { clsx } from 'clsx';

export interface InputProps extends JSX.HTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="input-wrapper">
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={clsx('input', { 'input-error': !!error }, className)}
        {...props}
      />
      {error && <span className="input-error-text">{error}</span>}
    </div>
  );
}

