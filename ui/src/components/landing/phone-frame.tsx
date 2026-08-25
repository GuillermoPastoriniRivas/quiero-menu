import { MaterialIcon } from '@/components/ui/material-icon';
import { cn } from '@/lib/utils';

export function PhoneFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'device-shell relative mx-auto aspect-[9/18] w-[290px] rounded-[2.75rem] border-[10px] border-[#1b1210] bg-[#1b1210] sm:w-[320px]',
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-40 rounded-[2.1rem] ring-1 ring-inset ring-white/10"
      />
      <div className="flex h-full w-full flex-col overflow-hidden rounded-[2.1rem] bg-surface">
        <div className="relative flex h-8 shrink-0 items-center justify-between bg-surface px-5 text-[10px] font-bold text-on-surface">
          <span>21:14</span>
          <div
            aria-hidden
            className="absolute left-1/2 top-1.5 h-5 w-[4.5rem] -translate-x-1/2 rounded-full bg-[#0d0807]"
          />
          <span className="flex items-center gap-0.5 text-on-surface">
            <MaterialIcon name="signal_cellular_alt" size="xs" className="text-[12px]" />
            <MaterialIcon name="wifi" size="xs" className="text-[12px]" />
            <MaterialIcon name="battery_full" size="xs" className="text-[12px]" />
          </span>
        </div>
        <div className="relative min-h-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
