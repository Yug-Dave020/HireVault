// apps/web/src/components/ui/progress.tsx
/**
 * Progress — simple div-based progress bar.
 *
 * WHY not @base-ui/react/progress: the base-nova shadcn style installed
 * a Progress whose sub-components (ProgressTrack, ProgressIndicator) must
 * be rendered explicitly, but our onboarding page passes a plain `value`
 * prop (standard shadcn Radix API). This implementation matches the standard
 * Radix-style API: <Progress value={0-100} /> and just works.
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number | null;
}

function Progress({ className, value, ...props }: ProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value ?? 0));

  return (
    <div
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      data-slot="progress"
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-slate-200",
        className
      )}
      {...props}
    >
      <div
        data-slot="progress-indicator"
        className="h-full rounded-full bg-[hsl(221,62%,22%)] transition-all duration-500 ease-out"
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}

export { Progress };
