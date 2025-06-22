export default function Loading() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="w-32 h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse"></div>
          <div className="w-full h-12 bg-gray-200 dark:bg-gray-700 rounded mb-6 animate-pulse"></div>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
            <div>
              <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse"></div>
              <div className="w-48 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Image Skeleton */}
        <div className="w-full h-64 md:h-96 bg-gray-200 dark:bg-gray-700 rounded-2xl mb-8 animate-pulse"></div>

        {/* Content Skeleton */}
        <div className="space-y-4 mb-12">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  )
}
