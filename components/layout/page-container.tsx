import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  padBottom?: boolean;
}

export function PageContainer({ children, className, padBottom = true }: PageContainerProps) {
  return (
    <main className={cn("flex-1 px-4 py-4", padBottom && "pb-24", className)}>
      {children}
    </main>
  );
}
