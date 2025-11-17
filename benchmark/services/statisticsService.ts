import type { Statistics } from "../types/index.js";

/**
 * Calculate statistics from an array of numbers
 */
export function calculateStatistics(values: number[]): Statistics {
  if (values.length === 0) {
    return {
      mean: "0",
      median: "0",
      min: "0",
      max: "0",
      stdDev: "0",
      count: 0,
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const count = values.length;
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / count;
  const median =
    count % 2 === 0
      ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2
      : sorted[Math.floor(count / 2)];
  const min = sorted[0];
  const max = sorted[count - 1];
  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / count;
  const stdDev = Math.sqrt(variance);

  return {
    mean: mean.toFixed(2),
    median: median.toFixed(2),
    min: min.toFixed(2),
    max: max.toFixed(2),
    stdDev: stdDev.toFixed(2),
    count,
  };
}

