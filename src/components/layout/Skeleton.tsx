/**
 * Loading skeleton components using Tailwind's animate-pulse.
 * Bloomberg terminal dark aesthetic (bg-gray-800 on bg-gray-900/950 backgrounds).
 */

export function SkeletonLine({ width = 'w-full', height = 'h-4' }: { width?: string; height?: string }) {
  return (
    <div className={`${width} ${height} bg-gray-800 rounded animate-pulse`} />
  );
}

export function SkeletonTable({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="bloomberg-border bg-gray-900">
      <div className="bloomberg-header px-4">
        <SkeletonLine width="w-40" height="h-3" />
      </div>
      <div className="p-3 space-y-2.5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-3">
            {Array.from({ length: cols }).map((_, j) => (
              <SkeletonLine key={j} width={j === 0 ? 'w-8' : j === 1 ? 'w-24' : 'w-12'} height="h-3" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bloomberg-border bg-gray-900 p-4 space-y-3">
      <SkeletonLine width="w-24" height="h-3" />
      <SkeletonLine width="w-16" height="h-6" />
      <SkeletonLine width="w-32" height="h-3" />
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-border bg-gray-900 p-4">
        <div className="flex gap-4">
          <div className="w-16 h-16 bg-gray-800 rounded animate-pulse" />
          <div className="flex-1 space-y-2">
            <SkeletonLine width="w-40" height="h-5" />
            <SkeletonLine width="w-24" height="h-3" />
            <SkeletonLine width="w-32" height="h-3" />
          </div>
        </div>
      </div>
      <SkeletonTable rows={4} cols={8} />
    </div>
  );
}
