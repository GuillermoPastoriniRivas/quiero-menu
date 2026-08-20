'use client';

import { cn } from '@/lib/utils';
import { Input } from './input';

export function formatThousands(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '';
}

interface MoneyInputProps {
  value: string;
  onChange: (raw: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  'aria-label'?: string;
}

export function MoneyInput({
  value,
  onChange,
  placeholder,
  className,
  autoFocus,
  onKeyDown,
  onBlur,
  ...rest
}: MoneyInputProps) {
  return (
    <Input
      type="text"
      inputMode="numeric"
      autoFocus={autoFocus}
      value={formatThousands(value)}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
      className={cn('h-9 px-2 text-sm font-semibold', className)}
      {...rest}
    />
  );
}
