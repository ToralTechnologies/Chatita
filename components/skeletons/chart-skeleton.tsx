export default function ChartSkeleton() {
  return (
    <div className="bg-white rounded-card shadow-card p-6 animate-pulse">
      {/* Title */}
      <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>

      {/* Chart area */}
      <div className="space-y-4">
        {/* Bars/lines simulation */}
        {[60, 80, 45, 90, 70, 55, 85].map((height, i) => (
          <div key={i} className="flex items-end gap-3">
            <div className="h-3 bg-gray-200 rounded w-12"></div>
            <div
              className="bg-gray-200 rounded-t"
              style={{ height: `${height}px`, flex: 1 }}
            ></div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    </div>
  );
}
