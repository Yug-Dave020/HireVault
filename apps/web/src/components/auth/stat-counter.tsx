"use client";

import { useEffect, useRef, useState } from "react";

interface StatCounterProps {
  target: number;
  suffix?: string;
  prefix?: string;
  label: string;
  duration?: number;
}

export function StatCounter({
  target,
  suffix = "",
  prefix = "",
  label,
  duration = 1800,
}: StatCounterProps) {
  const [value, setValue] = useState(0);
  const startTs  = useRef<number | null>(null);
  const animId   = useRef<number>(0);

  useEffect(() => {
    // Stagger the start by a short delay so counters fire after paint
    const timeout = setTimeout(() => {
      function tick(ts: number) {
        if (!startTs.current) startTs.current = ts;
        const elapsed = ts - startTs.current;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));
        if (progress < 1) {
          animId.current = requestAnimationFrame(tick);
        }
      }
      animId.current = requestAnimationFrame(tick);
    }, 300);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(animId.current);
    };
  }, [target, duration]);

  return (
    <div className="text-center">
      <p className="text-2xl font-bold text-white tracking-tight">
        {prefix}{value.toLocaleString()}{suffix}
      </p>
      <p className="text-xs text-[#8aa3bc] mt-0.5 leading-tight">{label}</p>
    </div>
  );
}
