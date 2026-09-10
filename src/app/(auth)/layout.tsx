import { Brain } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden bg-background">
      {/* Top right theme toggle for auth pages */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Playful Neo-Brutalist Dot Matrix Grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden select-none"
      >
        <div className="absolute inset-0 bg-[radial-gradient(var(--border)_1.5px,transparent_1.5px)] bg-size-[28px_28px] opacity-[0.09] dark:opacity-[0.14]" />
      </div>

      {/* Logo */}
      <div className="flex items-center gap-3 mb-8 relative z-10">
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary text-primary-foreground border-2 border-border shadow-[2px_2px_0px_var(--shadow-color)]">
          <Brain className="h-6 w-6 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading">
            Learn<span className="text-primary">Pulse</span>
          </h1>
          <p className="text-xs font-medium text-muted-foreground">Adaptive Knowledge Tracing System</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-xl border-2 border-border bg-card p-6 sm:p-8 relative z-10 shadow-[4px_4px_0px_var(--shadow-color)]">
        {children}
      </div>
    </div>
  );
}
