/**
 * Shared type definitions for the benchmark project
 */

export interface Version {
  name: string;
  command: string;
}

export interface FeatureCombination {
  name: string;
  flags: string[];
}

export interface BenchmarkConfig {
  testId: string;
  version: Version;
  packageManager: string;
  features: FeatureCombination;
  withCache: boolean;
  withPlaywrightCache: boolean;
}

export interface BenchmarkResult {
  testId: string;
  version: string;
  packageManager: string;
  features: string;
  withCache: string;
  withPlaywrightCache: string;
  iterations: number;
  successCount: number;
  durationMean: string;
  durationMedian: string;
  durationMin: string;
  durationMax: string;
  durationStdDev: string;
  success: string;
  error: string;
  smokeTestStatus: string;
  smokeTestPassCount: string | number;
  smokeTestFailCount: string | number;
}

export interface BenchmarkState {
  results: BenchmarkResult[];
  iterationsPerTest: number;
  enableSmokeTest: boolean;
  shouldSaveOnExit: boolean;
  resultsFile: string;
}

export interface Statistics {
  mean: string;
  median: string;
  min: string;
  max: string;
  stdDev: string;
  count: number;
}

export interface TestResult {
  success: boolean;
  duration: number;
  error?: string;
  smokeTest?: SmokeTestResult;
}

export interface SmokeTestResult {
  success: boolean;
  duration: number;
  error?: string;
  stdout?: string;
  stderr?: string;
}

export interface TestSelection {
  versions?: string[];
  packageManagers?: string[];
  features?: string[];
  cacheOptions?: boolean[];
  playwrightCacheOptions?: boolean[];
  mode?: "rerun-failed";
  failedConfigs?: BenchmarkConfig[];
}

export interface ParsedResults {
  completed: Set<string>;
  failed: Set<string>;
  failedConfigs: BenchmarkConfig[];
}

