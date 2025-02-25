import { Skeleton } from "@/components/ui/skeleton";

export function StoreSkeleton() {
  return (
    <div className="rounded-lg border border-border/40 bg-card text-card-foreground p-6">
      <div className="space-y-3">
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-20" />
            <div className="h-1 w-1 rounded-full bg-muted" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
      </div>
    </div>
  );
} 