'use client';

import { useEffect, useState } from 'react';
import BottomNav from '@/components/bottom-nav';
import ExportButton from '@/components/export-button';
import CardSkeleton from '@/components/skeletons/card-skeleton';
import ChartSkeleton from '@/components/skeletons/chart-skeleton';
import { TrendingUp, Calendar, AlertTriangle, CheckCircle, Info, Lightbulb, Activity, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from '@/lib/i18n/context';
import { exportAnalyticsToPDF, exportAnalyticsToCSV } from '@/lib/export-utils';
import dynamic from 'next/dynamic';

// Dynamically import charts to avoid SSR issues
const GlucoseTrendChart = dynamic(() => import('@/components/charts/glucose-trend-chart'), { ssr: false });
const TimeInRangeChart = dynamic(() => import('@/components/charts/time-in-range-chart'), { ssr: false });
const MealComparisonChart = dynamic(() => import('@/components/charts/meal-comparison-chart'), { ssr: false });
const DailyPatternChart = dynamic(() => import('@/components/charts/daily-pattern-chart'), { ssr: false });

export default function InsightsPage() {
  const { t } = useTranslation();
  const [correlation, setCorrelation] = useState<any>(null);
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30); // days

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [correlationRes, insightsRes] = await Promise.all([
        fetch(`/api/analytics/correlation?days=${period}`),
        fetch(`/api/analytics/insights?days=${period}`),
      ]);

      if (correlationRes.ok) {
        const data = await correlationRes.json();
        setCorrelation(data);
      }

      if (insightsRes.ok) {
        const data = await insightsRes.json();
        setAiInsights(data.insights || []);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPatternIcon = (type: string) => {
    switch (type) {
      case 'spike':
      case 'fasting-high':
      case 'timeofday-high':
        return <AlertTriangle className="w-6 h-6 text-warning" />;
      case 'fasting-good':
      case 'lowcarb-success':
        return <CheckCircle className="w-6 h-6 text-success" />;
      default:
        return <Info className="w-6 h-6 text-primary" />;
    }
  };

  const getPatternColor = (severity: string) => {
    switch (severity) {
      case 'warning':
        return 'bg-warning/10 border-warning/30';
      case 'success':
        return 'bg-success/10 border-success/30';
      case 'info':
        return 'bg-primary/10 border-primary/30';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'tip':
        return <Lightbulb className="w-5 h-5 text-primary" />;
      default:
        return <Info className="w-5 h-5 text-primary" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-background pb-24">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-2xl mx-auto px-6 py-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              Insights & Analytics
            </h1>
            <div className="flex items-center gap-2 mt-3">
              {[7, 30, 90].map((days) => (
                <div key={days} className="h-8 w-20 bg-gray-200 rounded-full animate-pulse" />
              ))}
            </div>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">
          <CardSkeleton />
          <CardSkeleton />
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-background pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              Insights & Analytics
            </h1>
            {correlation && (
              <ExportButton
                onExportPDF={() => exportAnalyticsToPDF(correlation, period)}
                onExportCSV={() => exportAnalyticsToCSV(correlation, period)}
              />
            )}
          </div>

          {/* Period Selector */}
          <div className="flex items-center gap-2">
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => setPeriod(days)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  period === days
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {days} days
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">
        {correlation && (
          <>
            {/* A1C Estimation Card */}
            {correlation.a1cEstimate?.estimated && (
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-card border border-primary/20 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Estimated A1C</p>
                    <div className="text-4xl font-bold text-primary mb-1">
                      {correlation.a1cEstimate.estimated}%
                    </div>
                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      correlation.a1cEstimate.category === 'normal'
                        ? 'bg-success/20 text-success'
                        : correlation.a1cEstimate.category === 'prediabetes'
                        ? 'bg-warning/20 text-warning'
                        : 'bg-danger/20 text-danger'
                    }`}>
                      {correlation.a1cEstimate.category}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">Confidence: {correlation.a1cEstimate.confidence}</p>
                    <p className="text-xs text-gray-500">{correlation.a1cEstimate.readingsUsed} readings</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mt-3">{correlation.a1cEstimate.message}</p>
              </div>
            )}

            {/* Stats Overview */}
            <div className="bg-white rounded-card shadow-card p-6">
              <h2 className="font-semibold mb-4">Last {period} Days Summary</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-primary">
                    {correlation.stats.averageGlucose}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Avg Glucose (mg/dL)</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-success">
                    {correlation.stats.inRangePercent}%
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Time in Range</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-primary">
                    {correlation.stats.averageCarbs}g
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Avg Carbs/Meal</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-primary">
                    {correlation.mealsTracked}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Meals Tracked</div>
                </div>
              </div>

              {/* Time in Range Bar */}
              <div className="mt-6">
                <p className="text-sm font-medium mb-2">Time in Range Distribution</p>
                <div className="flex h-8 rounded-lg overflow-hidden">
                  <div
                    className="bg-danger flex items-center justify-center text-white text-xs font-medium"
                    style={{ width: `${correlation.stats.timeInRange.low}%` }}
                  >
                    {correlation.stats.timeInRange.low > 5 && `${correlation.stats.timeInRange.low}%`}
                  </div>
                  <div
                    className="bg-success flex items-center justify-center text-white text-xs font-medium"
                    style={{ width: `${correlation.stats.timeInRange.normal}%` }}
                  >
                    {correlation.stats.timeInRange.normal}%
                  </div>
                  <div
                    className="bg-warning flex items-center justify-center text-white text-xs font-medium"
                    style={{ width: `${correlation.stats.timeInRange.high}%` }}
                  >
                    {correlation.stats.timeInRange.high > 5 && `${correlation.stats.timeInRange.high}%`}
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>Low (&lt;70)</span>
                  <span>Normal (70-180)</span>
                  <span>High (&gt;180)</span>
                </div>
              </div>
            </div>

            {/* Visualizations */}
            {correlation.chartData && (
              <>
                {/* Glucose Trend Chart */}
                {correlation.chartData.trendData && correlation.chartData.trendData.length > 0 && (
                  <div className="bg-white rounded-card shadow-card p-6">
                    <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Glucose Trend
                    </h2>
                    <GlucoseTrendChart data={correlation.chartData.trendData} />
                  </div>
                )}

                {/* Time in Range Pie Chart */}
                {correlation.stats.timeInRange && (
                  <div className="bg-white rounded-card shadow-card p-6">
                    <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      Time in Range Distribution
                    </h2>
                    <TimeInRangeChart data={correlation.stats.timeInRange} />
                  </div>
                )}

                {/* Meal Type Comparison */}
                {correlation.chartData.mealComparison && correlation.chartData.mealComparison.length > 0 && (
                  <div className="bg-white rounded-card shadow-card p-6">
                    <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-primary" />
                      Average Glucose by Meal Type
                    </h2>
                    <MealComparisonChart data={correlation.chartData.mealComparison} />
                  </div>
                )}

                {/* Daily Pattern */}
                {correlation.chartData.dailyPattern && correlation.chartData.dailyPattern.length > 0 && (
                  <div className="bg-white rounded-card shadow-card p-6">
                    <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      Daily Glucose Pattern
                    </h2>
                    <DailyPatternChart data={correlation.chartData.dailyPattern} />
                  </div>
                )}
              </>
            )}

            {/* Detected Patterns */}
            {correlation.patterns && correlation.patterns.length > 0 && (
              <>
                <h2 className="font-semibold text-lg">Detected Patterns</h2>
                <div className="space-y-3">
                  {correlation.patterns.map((pattern: any, index: number) => (
                    <div
                      key={index}
                      className={`rounded-card border p-4 ${getPatternColor(pattern.severity)}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getPatternIcon(pattern.type)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{pattern.title}</h3>
                          <p className="text-sm text-gray-700">{pattern.description}</p>
                          {pattern.foods && pattern.foods.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {pattern.foods.map((food: string, i: number) => (
                                <span
                                  key={i}
                                  className="text-xs px-2 py-1 bg-white rounded-full border border-gray-200"
                                >
                                  {food}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* AI Insights */}
        {aiInsights && aiInsights.length > 0 && (
          <>
            <h2 className="font-semibold text-lg">Personalized Insights from Chatita</h2>
            <div className="space-y-3">
              {aiInsights.map((insight: any, index: number) => (
                <div
                  key={index}
                  className={`rounded-card border p-4 ${getPatternColor(insight.type)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getInsightIcon(insight.type)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{insight.title}</h3>
                      <p className="text-sm text-gray-700">{insight.message}</p>
                      {insight.action && (
                        <button className="mt-2 text-xs font-medium text-primary hover:underline">
                          {insight.action} →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* No Data State */}
        {correlation && correlation.glucoseEntries === 0 && correlation.mealsTracked === 0 && (
          <div className="bg-white rounded-card shadow-card p-8 text-center">
            <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Start Tracking to See Insights</h3>
            <p className="text-gray-600 text-sm mb-4">
              Log your meals and glucose readings to unlock personalized patterns and recommendations.
            </p>
            <div className="flex gap-3 justify-center">
              <a
                href="/add-meal"
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
              >
                Add Meal
              </a>
              <a
                href="/home"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Add Glucose
              </a>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="bg-yellow-50 border border-warning/30 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            💡 <strong>Note:</strong> These insights are for informational purposes only and should not replace medical advice. Always consult your healthcare provider for diabetes management decisions.
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
