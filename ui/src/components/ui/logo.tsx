import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const sizes = {
  sm: 24,
  md: 32,
  lg: 48,
} as const;

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const px = sizes[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/logo.svg"
        alt="Quiero Menu"
        width={px}
        height={px}
        priority
      />
      {showText && (
        <span
          className={`font-extrabold tracking-tight text-on-background ${
            size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : 'text-2xl'
          }`}
          style={{ fontFamily: 'var(--font-logo)' }}
        >
          quiero
          <span className="text-brand-orange">.menu</span>
        </span>
      )}
    </div>
  );
}
