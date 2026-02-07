import { cn } from "@/lib/utils"

interface SkeletonCardProps {
  className?: string
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-6", className)}>
      <div className="space-y-3">
        <div className="h-4 w-1/3 animate-pulse rounded bg-accent" />
        <div className="h-8 w-2/3 animate-pulse rounded bg-accent" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-accent" />
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="border-b border-border p-4">
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 flex-1 animate-pulse rounded bg-accent" />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-b border-border p-4 last:border-0">
          <div className="flex gap-4">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="h-4 flex-1 animate-pulse rounded bg-accent" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
