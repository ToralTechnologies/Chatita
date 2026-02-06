export default function MealCardSkeleton() {
  return (
    <div className="bg-white rounded-card shadow-card p-4 animate-pulse">
      <div className="flex items-start gap-4">
        {/* Image placeholder */}
        <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0"></div>

        {/* Content */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-5 bg-gray-200 rounded w-32"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="flex gap-2">
            <div className="h-6 bg-gray-200 rounded-full w-20"></div>
            <div className="h-6 bg-gray-200 rounded-full w-24"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
