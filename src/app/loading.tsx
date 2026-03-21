export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      {/* Hero skeleton */}
      <div className="text-center mb-10 sm:mb-14">
        <div className="h-6 w-40 bg-gray-800 rounded-full mx-auto mb-5 animate-pulse" />
        <div className="h-10 w-80 bg-gray-800 rounded-lg mx-auto mb-4 animate-pulse" />
        <div className="h-5 w-96 bg-gray-800 rounded mx-auto animate-pulse" />
      </div>

      {/* Search skeleton */}
      <div className="max-w-2xl mx-auto mb-6 sm:mb-10">
        <div className="h-12 bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />
      </div>

      {/* Filters skeleton */}
      <div className="flex gap-2 mb-8 overflow-x-auto">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 w-24 bg-gray-900 border border-gray-800 rounded-full shrink-0 animate-pulse" />
        ))}
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 animate-pulse">
            <div className="h-5 w-32 bg-gray-800 rounded mb-3" />
            <div className="h-4 w-full bg-gray-800 rounded mb-2" />
            <div className="h-4 w-3/4 bg-gray-800 rounded mb-4" />
            <div className="flex gap-2 mb-4">
              <div className="h-5 w-16 bg-gray-800 rounded-full" />
              <div className="h-5 w-20 bg-gray-800 rounded-full" />
            </div>
            <div className="h-4 w-24 bg-gray-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
