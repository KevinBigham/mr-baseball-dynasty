import { SkeletonCard } from './Skeleton';

export default function LoadingFallback() {
  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
