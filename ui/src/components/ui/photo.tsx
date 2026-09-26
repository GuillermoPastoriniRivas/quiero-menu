import Image from "next/image";
import { cn } from "@/lib/utils";

interface PhotoProps {
  src: string;
  alt?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fit?: "cover" | "contain";
}

export function Photo({ src, alt = "", className, sizes = "(max-width: 768px) 50vw, 25vw", priority, fit = "cover" }: PhotoProps) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      unoptimized
      sizes={sizes}
      priority={priority}
      className={cn(fit === "cover" ? "object-cover" : "object-contain", className)}
    />
  );
}
