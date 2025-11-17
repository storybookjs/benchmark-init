import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { FEATURE_COMBINATIONS, RESULTS_FILE } from "../config.js";
import type { BenchmarkConfig, BenchmarkResult, ParsedResults } from "../types/index.js";

/**
 * Save results to CSV file
 */
export function saveResults(results: BenchmarkResult[], resultsFile: string, append = false): void {
  if (results.length === 0 && !append) {
    console.log("\nNo results to save.");
    return;
  }

  // CSV header
  const headers = [
    "Test ID",
    "Version",
    "Package Manager",
    "Features",
    "With Cache",
    "With Playwright Cache",
    "Iterations",
    "Success Count",
    "Duration Mean (s)",
    "Duration Median (s)",
    "Duration Min (s)",
    "Duration Max (s)",
    "Duration StdDev (s)",
    "Success",
    "Error",
    "Smoke Test Status",
    "Smoke Test Pass Count",
    "Smoke Test Fail Count",
  ];

  // CSV rows
  const rows = results.map((r) => [
    r.testId,
    r.version,
    r.packageManager,
    r.features,
    r.withCache,
    r.withPlaywrightCache,
    r.iterations || 1,
    r.successCount !== undefined ? r.successCount.toString() : "1",
    r.durationMean !== undefined ? r.durationMean : "0.00",
    r.durationMedian !== undefined ? r.durationMedian : "0.00",
    r.durationMin !== undefined ? r.durationMin : "0.00",
    r.durationMax !== undefined ? r.durationMax : "0.00",
    r.durationStdDev !== undefined ? r.durationStdDev : "0.00",
    r.success,
    r.error || "",
    r.smokeTestStatus !== undefined ? r.smokeTestStatus : "-",
    r.smokeTestPassCount !== undefined ? r.smokeTestPassCount.toString() : "-",
    r.smokeTestFailCount !== undefined ? r.smokeTestFailCount.toString() : "-",
  ]);

  // Combine header and rows
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  if (append && existsSync(resultsFile)) {
    // Read existing results and merge
    const existingContent = readFileSync(resultsFile, "utf-8");
    const existingLines = existingContent.split("\n").filter((line) => line.trim());
    const existingHeaders = existingLines[0];
    const existingRows = existingLines.slice(1);

    // Create a map of existing test IDs
    const existingTestIds = new Set<string>();
    for (const row of existingRows) {
      const match = row.match(/^"([^"]+)"/);
      if (match) {
        existingTestIds.add(match[1]);
      }
    }

    // Filter out duplicates from new results
    const newRows = rows.filter((row) => !existingTestIds.has(row[0] as string));

    // Combine existing and new rows
    const mergedContent = [
      existingHeaders,
      ...existingRows,
      ...newRows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    writeFileSync(resultsFile, mergedContent);
  } else {
    writeFileSync(resultsFile, csvContent);
  }

  if (!append) {
    console.log(`\nResults saved to: ${resultsFile}`);
    console.log(`Total tests: ${results.length}`);
  }
}

/**
 * Parse existing CSV results and return sets of completed and failed test IDs
 * Also returns failed test configurations for rerun mode
 */
export function parseExistingResults(resultsFile: string): ParsedResults {
  if (!existsSync(resultsFile)) {
    return { completed: new Set(), failed: new Set(), failedConfigs: [] };
  }

  try {
    const content = readFileSync(resultsFile, "utf-8");
    const lines = content.split("\n").filter((line) => line.trim());

    if (lines.length <= 1) {
      return { completed: new Set(), failed: new Set(), failedConfigs: [] }; // Only header or empty
    }

    const headers = lines[0].split(",").map((h) => h.replace(/^"|"$/g, "").trim());

    // Find column indices
    const testIdIndex = headers.indexOf("Test ID");
    const versionIndex = headers.indexOf("Version");
    const packageManagerIndex = headers.indexOf("Package Manager");
    const featuresIndex = headers.indexOf("Features");
    const withCacheIndex = headers.indexOf("With Cache");
    const withPlaywrightCacheIndex = headers.indexOf("With Playwright Cache");
    const successIndex = headers.indexOf("Success");

    const completedTestIds = new Set<string>();
    const failedTestIds = new Set<string>();
    const failedConfigsMap = new Map<string, BenchmarkConfig>(); // Use Map to avoid duplicates

    for (const line of lines.slice(1)) {
      const values = line.match(/("(?:[^"\\]|\\.)*"|[^,]+)/g);
      if (!values || values.length === 0) continue;

      // Extract values, removing quotes
      const getValue = (index: number): string | null => {
        if (index === -1 || index >= values.length) return null;
        return values[index].replace(/^"|"$/g, "").trim();
      };

      const testId = getValue(testIdIndex);
      if (!testId) continue;

      // Extract base test ID (remove iteration suffix if present)
      const baseTestId = testId.replace(/-iter\d+$/, "");
      completedTestIds.add(baseTestId);

      // Check if this test failed
      const success = getValue(successIndex)?.toLowerCase();
      if (success === "no" || success === "partial") {
        failedTestIds.add(baseTestId);

        // Reconstruct configuration from CSV data
        const versionName = getValue(versionIndex);
        const packageManager = getValue(packageManagerIndex);
        const featuresName = getValue(featuresIndex);
        const withCacheStr = getValue(withCacheIndex);
        const withPlaywrightCacheStr = getValue(withPlaywrightCacheIndex);

        if (versionName && packageManager && featuresName) {
          // Find matching feature combination
          const features = FEATURE_COMBINATIONS.find((f) => f.name === featuresName);
          if (features) {
            const configKey = `${baseTestId}-${versionName}-${packageManager}-${featuresName}-${withCacheStr}-${withPlaywrightCacheStr}`;
            if (!failedConfigsMap.has(configKey)) {
              failedConfigsMap.set(configKey, {
                testId: baseTestId,
                version: {
                  name: versionName,
                  command: `storybook@${versionName}`,
                },
                packageManager,
                features,
                withCache: withCacheStr === "yes",
                withPlaywrightCache: withPlaywrightCacheStr === "yes",
              });
            }
          }
        }
      }
    }

    return {
      completed: completedTestIds,
      failed: failedTestIds,
      failedConfigs: Array.from(failedConfigsMap.values()),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`Warning: Could not parse existing results: ${errorMessage}`);
    return { completed: new Set(), failed: new Set(), failedConfigs: [] };
  }
}

/**
 * Remove results for specific test IDs from CSV
 */
export function removeResultsForTests(resultsFile: string, testIds: Set<string>): void {
  if (!existsSync(resultsFile)) {
    return;
  }

  const existingContent = readFileSync(resultsFile, "utf-8");
  const existingLines = existingContent.split("\n").filter((line) => line.trim());
  const header = existingLines[0];
  const filteredLines = existingLines.slice(1).filter((line) => {
    const match = line.match(/^"([^"]+)"/);
    if (match) {
      const testId = match[1].replace(/-iter\d+$/, "");
      return !testIds.has(testId);
    }
    return true;
  });

  const newContent = [header, ...filteredLines].join("\n");
  writeFileSync(resultsFile, newContent);
}

/**
 * Load existing results into memory, excluding specified test IDs
 */
export function loadExistingResults(
  resultsFile: string,
  testIdsToExclude: Set<string>
): BenchmarkResult[] {
  if (!existsSync(resultsFile)) {
    return [];
  }

  const results: BenchmarkResult[] = [];
  const existingContent = readFileSync(resultsFile, "utf-8");
  const existingLines = existingContent.split("\n").filter((line) => line.trim());

  if (existingLines.length <= 1) {
    return results;
  }

  for (const line of existingLines.slice(1)) {
    const values = line.match(/("(?:[^"\\]|\\.)*"|[^,]+)/g);
    if (values && values.length >= 9) {
      const parseValue = (val: string) => val.replace(/^"|"$/g, "");
      const testId = parseValue(values[0]);

      // Only load results for tests we're NOT excluding
      if (!testIdsToExclude.has(testId)) {
        if (values.length >= 15) {
          results.push({
            testId,
            version: parseValue(values[1]),
            packageManager: parseValue(values[2]),
            features: parseValue(values[3]),
            withCache: parseValue(values[4]),
            withPlaywrightCache: parseValue(values[5]),
            iterations: Number.parseInt(parseValue(values[6]), 10) || 1,
            successCount: Number.parseInt(parseValue(values[7]), 10) || 1,
            durationMean: parseValue(values[8]),
            durationMedian: parseValue(values[9]),
            durationMin: parseValue(values[10]),
            durationMax: parseValue(values[11]),
            durationStdDev: parseValue(values[12]),
            success: parseValue(values[13]),
            error: parseValue(values[14]),
            smokeTestStatus: parseValue(values[15]) || "-",
            smokeTestPassCount: parseValue(values[16]) || "-",
            smokeTestFailCount: parseValue(values[17]) || "-",
          });
        } else {
          results.push({
            testId,
            version: parseValue(values[1]),
            packageManager: parseValue(values[2]),
            features: parseValue(values[3]),
            withCache: parseValue(values[4]),
            withPlaywrightCache: parseValue(values[5]),
            iterations: 1,
            successCount: parseValue(values[7]) === "yes" ? 1 : 0,
            durationMean: parseValue(values[6]),
            durationMedian: parseValue(values[6]),
            durationMin: parseValue(values[6]),
            durationMax: parseValue(values[6]),
            durationStdDev: "0.00",
            success: parseValue(values[7]),
            error: parseValue(values[8]),
            smokeTestStatus: "-",
            smokeTestPassCount: "-",
            smokeTestFailCount: "-",
          });
        }
      }
    }
  }

  return results;
}
