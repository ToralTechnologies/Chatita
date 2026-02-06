'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';

interface Meal {
  id: string;
  name: string;
  category: string;
  carbs?: number;
  protein?: number;
  fat?: number;
  calories?: number;
  glucoseBefore?: number;
  glucoseAfter?: number;
  timestamp: string;
  restaurant?: string;
  notes?: string;
}

interface GlucoseReading {
  id: string;
  value: number;
  timestamp: string;
  notes?: string;
  mealId?: string;
}

// Export meals to PDF
export function exportMealsToPDF(meals: Meal[], dateRange?: { start: string; end: string }) {
  const doc = new jsPDF();

  // Add title
  doc.setFontSize(20);
  doc.text('Chatita - Meal History Report', 14, 20);

  // Add date range if provided
  if (dateRange) {
    doc.setFontSize(12);
    doc.text(`Period: ${dateRange.start} to ${dateRange.end}`, 14, 30);
  }

  // Add summary stats
  const avgGlucoseBefore =
    meals.filter((m) => m.glucoseBefore).reduce((sum, m) => sum + (m.glucoseBefore || 0), 0) /
    meals.filter((m) => m.glucoseBefore).length;

  const avgGlucoseAfter =
    meals.filter((m) => m.glucoseAfter).reduce((sum, m) => sum + (m.glucoseAfter || 0), 0) /
    meals.filter((m) => m.glucoseAfter).length;

  doc.setFontSize(11);
  const yPos = dateRange ? 38 : 30;
  doc.text(`Total Meals: ${meals.length}`, 14, yPos);
  doc.text(`Avg Glucose Before: ${avgGlucoseBefore.toFixed(1)} mg/dL`, 14, yPos + 7);
  doc.text(`Avg Glucose After: ${avgGlucoseAfter.toFixed(1)} mg/dL`, 14, yPos + 14);

  // Create table
  const tableData = meals.map((meal) => [
    new Date(meal.timestamp).toLocaleDateString(),
    meal.name,
    meal.category,
    meal.glucoseBefore?.toString() || '-',
    meal.glucoseAfter?.toString() || '-',
    meal.carbs?.toString() || '-',
    meal.calories?.toString() || '-',
  ]);

  autoTable(doc, {
    startY: yPos + 22,
    head: [['Date', 'Meal', 'Category', 'Glucose Before', 'Glucose After', 'Carbs (g)', 'Calories']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] }, // Primary color
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 40 },
      2: { cellWidth: 25 },
    },
  });

  // Save the PDF
  const filename = dateRange
    ? `chatita-meals-${dateRange.start}-to-${dateRange.end}.pdf`
    : `chatita-meals-${new Date().toISOString().split('T')[0]}.pdf`;

  doc.save(filename);
}

// Export meals to CSV
export function exportMealsToCSV(meals: Meal[], dateRange?: { start: string; end: string }) {
  const csvData = meals.map((meal) => ({
    Date: new Date(meal.timestamp).toLocaleDateString(),
    Time: new Date(meal.timestamp).toLocaleTimeString(),
    'Meal Name': meal.name,
    Category: meal.category,
    'Glucose Before (mg/dL)': meal.glucoseBefore || '',
    'Glucose After (mg/dL)': meal.glucoseAfter || '',
    'Carbs (g)': meal.carbs || '',
    'Protein (g)': meal.protein || '',
    'Fat (g)': meal.fat || '',
    'Calories': meal.calories || '',
    Restaurant: meal.restaurant || '',
    Notes: meal.notes || '',
  }));

  const csv = Papa.unparse(csvData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  const filename = dateRange
    ? `chatita-meals-${dateRange.start}-to-${dateRange.end}.csv`
    : `chatita-meals-${new Date().toISOString().split('T')[0]}.csv`;

  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

// Export glucose readings to PDF
export function exportGlucoseToPDF(
  readings: GlucoseReading[],
  dateRange?: { start: string; end: string }
) {
  const doc = new jsPDF();

  // Add title
  doc.setFontSize(20);
  doc.text('Chatita - Glucose Readings Report', 14, 20);

  // Add date range if provided
  if (dateRange) {
    doc.setFontSize(12);
    doc.text(`Period: ${dateRange.start} to ${dateRange.end}`, 14, 30);
  }

  // Add summary stats
  const avgGlucose = readings.reduce((sum, r) => sum + r.value, 0) / readings.length;
  const minGlucose = Math.min(...readings.map((r) => r.value));
  const maxGlucose = Math.max(...readings.map((r) => r.value));
  const inRange = readings.filter((r) => r.value >= 70 && r.value <= 180).length;
  const timeInRange = (inRange / readings.length) * 100;

  doc.setFontSize(11);
  const yPos = dateRange ? 38 : 30;
  doc.text(`Total Readings: ${readings.length}`, 14, yPos);
  doc.text(`Average: ${avgGlucose.toFixed(1)} mg/dL`, 14, yPos + 7);
  doc.text(`Range: ${minGlucose} - ${maxGlucose} mg/dL`, 14, yPos + 14);
  doc.text(`Time in Range (70-180): ${timeInRange.toFixed(1)}%`, 14, yPos + 21);

  // Create table
  const tableData = readings.map((reading) => [
    new Date(reading.timestamp).toLocaleDateString(),
    new Date(reading.timestamp).toLocaleTimeString(),
    reading.value.toString(),
    reading.notes || '-',
  ]);

  autoTable(doc, {
    startY: yPos + 29,
    head: [['Date', 'Time', 'Glucose (mg/dL)', 'Notes']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] },
    styles: { fontSize: 9 },
  });

  // Save the PDF
  const filename = dateRange
    ? `chatita-glucose-${dateRange.start}-to-${dateRange.end}.pdf`
    : `chatita-glucose-${new Date().toISOString().split('T')[0]}.pdf`;

  doc.save(filename);
}

// Export glucose readings to CSV
export function exportGlucoseToCSV(
  readings: GlucoseReading[],
  dateRange?: { start: string; end: string }
) {
  const csvData = readings.map((reading) => ({
    Date: new Date(reading.timestamp).toLocaleDateString(),
    Time: new Date(reading.timestamp).toLocaleTimeString(),
    'Glucose (mg/dL)': reading.value,
    Notes: reading.notes || '',
    'Meal ID': reading.mealId || '',
  }));

  const csv = Papa.unparse(csvData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  const filename = dateRange
    ? `chatita-glucose-${dateRange.start}-to-${dateRange.end}.csv`
    : `chatita-glucose-${new Date().toISOString().split('T')[0]}.csv`;

  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

// Export analytics/insights report to PDF
export function exportAnalyticsToPDF(analyticsData: any, period: number) {
  const doc = new jsPDF();

  // Add title
  doc.setFontSize(20);
  doc.text('Chatita - Analytics & Insights Report', 14, 20);

  // Add period info
  doc.setFontSize(12);
  doc.text(`Analysis Period: Last ${period} Days`, 14, 30);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 37);

  let yPos = 47;

  // A1C Estimate
  if (analyticsData.a1cEstimate?.estimated) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('A1C Estimate', 14, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    yPos += 7;
    doc.text(`Estimated A1C: ${analyticsData.a1cEstimate.estimated}%`, 20, yPos);
    yPos += 6;
    doc.text(`Category: ${analyticsData.a1cEstimate.category}`, 20, yPos);
    yPos += 6;
    doc.text(`Confidence: ${analyticsData.a1cEstimate.confidence}`, 20, yPos);
    yPos += 6;
    doc.text(`Based on ${analyticsData.a1cEstimate.readingsUsed} readings`, 20, yPos);
    yPos += 10;
  }

  // Summary Stats
  if (analyticsData.stats) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary Statistics', 14, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    yPos += 7;
    doc.text(`Average Glucose: ${analyticsData.stats.averageGlucose} mg/dL`, 20, yPos);
    yPos += 6;
    doc.text(`Time in Range: ${analyticsData.stats.inRangePercent}%`, 20, yPos);
    yPos += 6;
    doc.text(`Average Carbs per Meal: ${analyticsData.stats.averageCarbs}g`, 20, yPos);
    yPos += 6;
    doc.text(`Meals Tracked: ${analyticsData.mealsTracked}`, 20, yPos);
    yPos += 10;

    // Time in Range Distribution
    if (analyticsData.stats.timeInRange) {
      doc.text('Time in Range Distribution:', 20, yPos);
      yPos += 6;
      doc.text(`  Low (<70 mg/dL): ${analyticsData.stats.timeInRange.low}%`, 25, yPos);
      yPos += 6;
      doc.text(`  Normal (70-180 mg/dL): ${analyticsData.stats.timeInRange.normal}%`, 25, yPos);
      yPos += 6;
      doc.text(`  High (>180 mg/dL): ${analyticsData.stats.timeInRange.high}%`, 25, yPos);
      yPos += 10;
    }
  }

  // Detected Patterns
  if (analyticsData.patterns && analyticsData.patterns.length > 0) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Detected Patterns', 14, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    yPos += 7;

    analyticsData.patterns.forEach((pattern: any) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.text(`• ${pattern.title}`, 20, yPos);
      doc.setFont('helvetica', 'normal');
      yPos += 5;
      const descLines = doc.splitTextToSize(pattern.description, 170);
      doc.text(descLines, 25, yPos);
      yPos += descLines.length * 5 + 3;
    });
  }

  // Save the PDF
  const filename = `chatita-analytics-${period}days-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

// Export analytics/insights report to CSV
export function exportAnalyticsToCSV(analyticsData: any, period: number) {
  const csvData: any[] = [];

  // Add summary row
  csvData.push({
    'Report Type': 'Analytics Summary',
    'Period (days)': period,
    'Generated Date': new Date().toLocaleDateString(),
    'Average Glucose (mg/dL)': analyticsData.stats?.averageGlucose || '',
    'Time in Range (%)': analyticsData.stats?.inRangePercent || '',
    'Average Carbs (g)': analyticsData.stats?.averageCarbs || '',
    'Meals Tracked': analyticsData.mealsTracked || '',
    'A1C Estimate (%)': analyticsData.a1cEstimate?.estimated || '',
    'A1C Category': analyticsData.a1cEstimate?.category || '',
  });

  // Add patterns
  if (analyticsData.patterns && analyticsData.patterns.length > 0) {
    csvData.push({});
    csvData.push({ 'Report Type': 'Detected Patterns' });
    analyticsData.patterns.forEach((pattern: any) => {
      csvData.push({
        'Pattern Type': pattern.type,
        'Title': pattern.title,
        'Description': pattern.description,
        'Severity': pattern.severity,
      });
    });
  }

  const csv = Papa.unparse(csvData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  const filename = `chatita-analytics-${period}days-${new Date().toISOString().split('T')[0]}.csv`;

  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
