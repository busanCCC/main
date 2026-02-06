import { Skeleton } from "@/app/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar skeleton */}
      <div className="w-[60px] border-r bg-card p-3 flex flex-col gap-4">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <div className="flex-1 flex flex-col gap-3 mt-4">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 p-8">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-72 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="mt-8">
          <Skeleton className="h-10 w-full rounded-lg mb-4" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg mb-2" />
          ))}
        </div>
      </div>
    </div>
  );
}
