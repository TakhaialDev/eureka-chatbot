"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: ((i * 137.5) % 100).toFixed(1),
  y: ((i * 93.7) % 100).toFixed(1),
  size: ((i % 3) + 1).toFixed(0),
  dur: (((i * 7) % 12) + 10).toFixed(0),
  delay: ((i * 3.3) % 9).toFixed(1),
}));

function DarkEffects() {
  return (
    <>
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(142, 198, 65, 0.12), transparent)",
        }}
      />
      <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-primary/6 blur-[110px]" />
      <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-green-700/8 blur-[90px]" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {PARTICLES.map((p) => (
          <span
            key={p.id}
            className="particle absolute rounded-full bg-primary/25"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDuration: `${p.dur}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>
    </>
  );
}

function LightEffects() {
  return (
    <>
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-green-200/50 blur-[120px]" />
      <div className="absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-lime-100/60 blur-[100px]" />
      <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-100/40 blur-[90px]" />
    </>
  );
}

export function BackgroundEffects() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {resolvedTheme === "dark" ? <DarkEffects /> : <LightEffects />}
    </div>
  );
}
