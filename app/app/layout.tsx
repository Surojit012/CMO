import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen text-[var(--color-fg)]"
      style={{
        background:
          "radial-gradient(circle at top, rgba(255,255,255,0.9), transparent 40%), linear-gradient(180deg, #fafaf9 0%, #f3f2ef 100%)",
      }}
    >
      {children}
    </div>
  );
}
