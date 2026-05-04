// apps/web/src/components/dashboard/skeleton-jobs.tsx
/**
 * SkeletonJobCards — three animated placeholder cards displayed while the
 * real job feed loads. Uses the shimmer animation from globals.css plus
 * shadcn Skeleton for individual content lines.
 * This is a Server Component (no "use client") since it contains no interactivity.
 */

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

function SkeletonJobCard() {
  return (
    <Card className="overflow-hidden border border-slate-100 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            {/* Job title */}
            <Skeleton className="h-5 w-3/4 animate-shimmer" />
            {/* Company + location */}
            <Skeleton className="h-4 w-1/2 animate-shimmer" />
          </div>
          {/* Match score badge placeholder */}
          <Skeleton className="h-8 w-16 rounded-full animate-shimmer flex-shrink-0" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {/* Skill chips */}
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full animate-shimmer" />
          <Skeleton className="h-6 w-20 rounded-full animate-shimmer" />
          <Skeleton className="h-6 w-14 rounded-full animate-shimmer" />
        </div>
        {/* Description lines */}
        <Skeleton className="h-3 w-full animate-shimmer" />
        <Skeleton className="h-3 w-5/6 animate-shimmer" />
        {/* Action row */}
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-4 w-24 animate-shimmer" />
          <Skeleton className="h-9 w-28 rounded-md animate-shimmer" />
        </div>
      </CardContent>
    </Card>
  );
}

export function SkeletonJobCards() {
  return (
    <div className="space-y-4">
      <SkeletonJobCard />
      <SkeletonJobCard />
      <SkeletonJobCard />
    </div>
  );
}
