export function AnimatedBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden z-0 select-none"
    >
      {/* Playful Neo-Brutalist Dot Matrix Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(var(--border)_1.5px,transparent_1.5px)] bg-size-[28px_28px] opacity-[0.09] dark:opacity-[0.14]" />
    </div>
  );
}
