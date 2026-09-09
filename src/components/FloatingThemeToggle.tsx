"use client";

import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

interface FloatingThemeToggleProps {
  className?: string;
}

export function FloatingThemeToggle({ className }: FloatingThemeToggleProps) {
  return (
    <div
      className={cn(
        "fixed top-4 right-5 z-50 flex items-center gap-2",
        className
      )}
    >
      <ThemeToggle />
    </div>
  );
}
