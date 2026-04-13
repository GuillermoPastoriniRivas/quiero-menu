import { cn } from "@/lib/utils";

const sizeMap = {
  xs: "text-[16px]",
  sm: "text-[18px]",
  md: "text-[20px]",
  lg: "text-[24px]",
  xl: "text-[32px]",
} as const;

interface MaterialIconProps {
  name: string;
  size?: keyof typeof sizeMap;
  fill?: boolean;
  className?: string;
}

export function MaterialIcon({ name, size = "md", fill = false, className }: MaterialIconProps) {
  return (
    <span
      className={cn("material-symbols-outlined select-none", sizeMap[size], className)}
      style={fill ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {name}
    </span>
  );
}
