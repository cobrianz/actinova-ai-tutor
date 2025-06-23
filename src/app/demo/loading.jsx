export default function DemoLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Loading Demo</h2>
        <p className="text-gray-600 dark:text-gray-400">Preparing your interactive experience...</p>
      </div>
    </div>
  )
}
