'use client';

import { MaterialIcon } from '@/components/ui/material-icon';
import { cn } from '@/lib/utils';

const STEPS = [
  { label: 'Subi tu menu', icon: 'photo_camera' },
  { label: 'Revisa y edita', icon: 'edit_note' },
  { label: 'Publica', icon: 'rocket_launch' },
] as const;

interface OnboardingStepsProps {
  current: number;
  className?: string;
}

export function OnboardingSteps({ current, className }: OnboardingStepsProps) {
  return (
    <ol className={cn('flex items-center justify-center', className)}>
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={step.label} className="flex items-center">
            {i > 0 && (
              <span
                className={cn(
                  'mx-1.5 h-px w-4 sm:mx-2.5 sm:w-10',
                  done || active ? 'bg-primary/40' : 'bg-outline-variant/40',
                )}
              />
            )}
            <span
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold sm:text-xs transition-colors',
                done && 'gradient-cta text-white shadow-sm shadow-primary/20',
                active && 'bg-primary/10 text-primary ring-1 ring-primary/30',
                !done && !active && 'bg-surface-container-low text-on-surface-variant',
              )}
            >
              <MaterialIcon name={done ? 'check' : step.icon} size="xs" />
              <span className="hidden sm:inline">{step.label}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}