export default function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-orange-400 font-mono text-xs animate-pulse tracking-widest">
        LOADING…
      </div>
    </div>
  );
}
