import type { BenchmarkConfig, Statistics, SmokeTestResult } from "../types/index.js";

/**
 * Log benchmark start information
 */
export function logBenchmarkStart(
  config: BenchmarkConfig,
  iteration: number,
  totalIterations: number
): void {
  const {
    testId,
    version,
    packageManager,
    features,
    withCache,
    withPlaywrightCache,
  } = config;
  const iterationSuffix =
    totalIterations > 1
      ? ` (iteration ${iteration + 1}/${totalIterations})`
      : "";
  console.log(`\n[${testId}${iterationSuffix}] Starting benchmark:`);
  console.log(`  Version: ${version.name}`);
  console.log(`  Package Manager: ${packageManager}`);
  console.log(`  Features: ${features.name}`);
  console.log(`  With Cache: ${withCache}`);
  console.log(`  With Playwright Cache: ${withPlaywrightCache}`);
}

/**
 * Log benchmark result
 */
export function logBenchmarkResult(
  result: { success: boolean },
  duration: number
): void {
  console.log(
    `  Result: ${result.success ? "SUCCESS" : "FAILED"} (${duration.toFixed(
      2
    )}s)`
  );
}

/**
 * Log smoke test result
 */
export function logSmokeTestResult(result: SmokeTestResult): void {
  console.log(
    `  Smoke Test: ${
      result.success ? "PASSED" : "FAILED"
    } (${result.duration.toFixed(2)}s)`
  );
  if (!result.success) {
    console.log(`  Smoke Test Error: ${result.error}`);
  }
}

/**
 * Log summary statistics
 */
export function logSummary(
  stats: Statistics,
  successCount: number,
  totalIterations: number,
  smokeTestResults: SmokeTestResult[],
  enableSmokeTest: boolean
): void {
  let summaryMessage = `  Summary: ${successCount}/${totalIterations} successful | Mean: ${stats.mean}s | Median: ${stats.median}s | Min: ${stats.min}s | Max: ${stats.max}s | StdDev: ${stats.stdDev}s`;
  if (enableSmokeTest && smokeTestResults.length > 0) {
    const smokeTestPassCount = smokeTestResults.filter((r) => r.success).length;
    summaryMessage += ` | Smoke Test: ${smokeTestPassCount}/${smokeTestResults.length} passed`;
  }
  console.log(summaryMessage);
}

/**
 * Log progress update
 */
export function logProgress(
  completed: number,
  total: number,
  alreadyCompleted: number,
  totalConfigs: number,
  totalRunsCompleted: number,
  totalRuns: number
): void {
  console.log(
    `\nProgress: ${completed}/${total} configurations completed (${
      alreadyCompleted + completed
    }/${totalConfigs} total) | ${totalRunsCompleted}/${totalRuns} total runs`
  );
}

