import {
  CACHE_OPTIONS,
  FEATURE_COMBINATIONS,
  PACKAGE_MANAGERS,
  PLAYWRIGHT_CACHE_OPTIONS,
} from "../config.js";
import type { BenchmarkConfig, TestSelection, Version } from "../types/index.js";

/**
 * Generate all test configurations
 */
export function generateTestConfigurations(versions: Version[]): BenchmarkConfig[] {
  const configs: BenchmarkConfig[] = [];
  let testId = 1;

  for (const version of versions) {
    for (const packageManager of PACKAGE_MANAGERS) {
      for (const features of FEATURE_COMBINATIONS) {
        // Only include Playwright cache options if test feature is selected
        const hasTestFeature = features.flags.includes("test");
        const playwrightCacheOptions = hasTestFeature ? PLAYWRIGHT_CACHE_OPTIONS : [false]; // Default to false (no cache) when test feature is not selected

        for (const withCache of CACHE_OPTIONS) {
          for (const withPlaywrightCache of playwrightCacheOptions) {
            configs.push({
              testId: `test-${testId.toString().padStart(4, "0")}`,
              version,
              packageManager,
              features,
              withCache,
              withPlaywrightCache,
            });
            testId++;
          }
        }
      }
    }
  }

  return configs;
}

/**
 * Generate test configurations based on user selection
 */
export function generateConfigurationsFromSelection(
  selection: TestSelection | null,
  allVersions: Version[]
): BenchmarkConfig[] {
  if (!selection) {
    return generateTestConfigurations(allVersions);
  }

  const configs: BenchmarkConfig[] = [];
  let testId = 1;

  const selectedVersions = allVersions.filter((v) => selection.versions?.includes(v.name));
  const selectedPackageManagers = PACKAGE_MANAGERS.filter((pm) =>
    selection.packageManagers?.includes(pm)
  );
  const selectedFeatureCombinations = FEATURE_COMBINATIONS.filter((f) =>
    selection.features?.includes(f.name)
  );

  // Sort cache options to ensure "without cache" runs before "with cache"
  const sortedCacheOptions = [...(selection.cacheOptions || [])].sort((a, b) => {
    // false (without cache) should come before true (with cache)
    return a === b ? 0 : a ? 1 : -1;
  });
  const sortedPlaywrightCacheOptions = [...(selection.playwrightCacheOptions || [])].sort(
    (a, b) => {
      // false (without cache) should come before true (with cache)
      return a === b ? 0 : a ? 1 : -1;
    }
  );

  for (const version of selectedVersions) {
    for (const packageManager of selectedPackageManagers) {
      for (const features of selectedFeatureCombinations) {
        // Only include Playwright cache options if test feature is selected
        const hasTestFeature = features.flags.includes("test");
        const playwrightCacheOptions = hasTestFeature ? sortedPlaywrightCacheOptions : [false]; // Default to false (no cache) when test feature is not selected

        for (const withCache of sortedCacheOptions) {
          for (const withPlaywrightCache of playwrightCacheOptions) {
            configs.push({
              testId: `test-${testId.toString().padStart(4, "0")}`,
              version,
              packageManager,
              features,
              withCache,
              withPlaywrightCache,
            });
            testId++;
          }
        }
      }
    }
  }

  return configs;
}
