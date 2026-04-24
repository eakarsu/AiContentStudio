export default function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex gap-6">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className={`h-3 bg-gray-200 rounded ${i === 0 ? 'w-32' : i === columns - 1 ? 'w-24 ml-auto' : 'w-20'}`} />
        ))}
      </div>
      {/* Row skeletons */}
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="px-6 py-4 flex items-center gap-6 border-b border-gray-50">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-48 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-64" />
          </div>
          <div className="h-6 bg-gray-200 rounded-full w-20" />
          <div className="h-3 bg-gray-200 rounded w-24" />
          <div className="flex gap-2">
            <div className="h-8 w-8 bg-gray-200 rounded-lg" />
            <div className="h-8 w-8 bg-gray-200 rounded-lg" />
            <div className="h-8 w-8 bg-gray-200 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
