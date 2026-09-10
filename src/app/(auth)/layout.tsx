import { Brain } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-125 w-200 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-75 w-125 rounded-full bg-primary/5 blur-[80px]" />
      </div>

      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Brain className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground font-display">LearnPulse</h1>
          <p className="text-xs text-muted-foreground">Adaptive Knowledge Tracing System</p>
        </div>
      </div>

      {/* Card */}
      <div className="glass-card w-full max-w-md rounded-2xl p-8 relative z-10">
        {children}
      </div>
    </div>
  );
}
