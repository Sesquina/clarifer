import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  fallback: string;
  className?: string;
}

export function Avatar({ src, fallback, className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={fallback}
        className={cn("h-10 w-10 rounded-full object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary",
        className
      )}
    >
      {fallback
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)}
    </div>
  );
}
