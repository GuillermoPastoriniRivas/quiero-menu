import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  href?: string;
}

const sizes = {
  sm: 24,
  md: 32,
  lg: 48,
} as const;

export function Logo({ size = 'md', showText = true, className = '', href }: LogoProps) {
  const px = sizes[size];

  const content = (
    <>
      <Image
        src="/logo.svg"
        alt="Quiero Menu"
        width={px}
        height={px}
        priority
      />
      {showText && (
        <span
          className={`font-extrabold tracking-tight text-brand-orange ${
            size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : 'text-2xl'
          }`}
          style={{ fontFamily: 'var(--font-logo)' }}
        >
          Quiero
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`flex items-center gap-2 ${className}`}>
        {content}
      </Link>
    );
  }

  return <div className={`flex items-center gap-2 ${className}`}>{content}</div>;
}
