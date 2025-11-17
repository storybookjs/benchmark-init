import { readFileSync, writeFileSync } from "node:fs";
import { RESULTS_FILE } from "./config.js";
import type { BenchmarkResult } from "./types/index.js";

interface ComparisonRow {
  version: string;
  durationMean: number;
  durationMedian: number;
  durationMin: number;
  durationMax: number;
  durationStdDev: number;
  success: boolean;
}

interface ConfigurationGroup {
  packageManager: string;
  features: string;
  withCache: string;
  withPlaywrightCache: string;
  results: ComparisonRow[];
}

/**
 * Parse CSV file and return structured data
 */
function parseCSV(filePath: string): BenchmarkResult[] {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.trim().split("\n");
  const headers = lines[0].split(",");

  const results: BenchmarkResult[] = [];

  for (let i = 1; i < lines.length; i++) {
    let line = lines[i];
    // Remove trailing comma if present (common CSV export issue)
    line = line.replace(/,$/, "");
    
    // Handle CSV with quoted fields (especially for Command column)
    // Use a more robust CSV parser that handles quoted fields with commas and escaped quotes
    const values: string[] = [];
    let currentValue = "";
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      const nextChar = j < line.length - 1 ? line[j + 1] : null;

      if (char === '"') {
        // Handle escaped quotes ("")
        if (inQuotes && nextChar === '"') {
          currentValue += '"';
          j++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
          // Don't include the quote character itself in the value
        }
      } else if (char === "," && !inQuotes) {
        values.push(currentValue);
        currentValue = "";
      } else {
        currentValue += char;
      }
    }
    // Push last value if there's anything left
    if (currentValue.length > 0) {
      values.push(currentValue);
    }

    // Trim whitespace and remove surrounding quotes from values
    const trimmedValues = values.map((v) => {
      const trimmed = v.trim();
      // Remove surrounding quotes if present
      if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
        return trimmed.slice(1, -1).replace(/""/g, '"');
      }
      return trimmed;
    });

    // Handle case where we might have fewer values than headers (due to trailing empty columns)
    while (trimmedValues.length < headers.length) {
      trimmedValues.push("");
    }

    if (trimmedValues.length > headers.length) {
      console.warn(`Skipping malformed line ${i + 1}: expected ${headers.length} columns, got ${trimmedValues.length}`);
      continue;
    }

    const result: BenchmarkResult = {
      testId: trimmedValues[0] || "",
      version: trimmedValues[1] || "",
      packageManager: trimmedValues[2] || "",
      features: trimmedValues[3] || "",
      withCache: trimmedValues[4] || "",
      withPlaywrightCache: trimmedValues[5] || "",
      iterations: parseInt(trimmedValues[6] || "1", 10),
      successCount: parseInt(trimmedValues[7] || "0", 10),
      durationMean: trimmedValues[8] || "0",
      durationMedian: trimmedValues[9] || "0",
      durationMin: trimmedValues[10] || "0",
      durationMax: trimmedValues[11] || "0",
      durationStdDev: trimmedValues[12] || "0",
      success: trimmedValues[13] || "no",
      error: trimmedValues[14] || "",
      smokeTestStatus: trimmedValues[15] || "",
      smokeTestPassCount: trimmedValues[16] || "0",
      smokeTestFailCount: trimmedValues[17] || "0",
      command: trimmedValues[18] || "",
    };

    results.push(result);
  }

  return results;
}

/**
 * Group results by configuration (package manager, features, cache settings)
 */
function groupByConfiguration(results: BenchmarkResult[]): Map<string, ConfigurationGroup> {
  const groups = new Map<string, ConfigurationGroup>();

  for (const result of results) {
    // Skip failed tests
    if (result.success !== "yes") {
      continue;
    }

    // Skip tests with zero duration (failed tests)
    const durationMean = parseFloat(result.durationMean);
    if (isNaN(durationMean) || durationMean === 0) {
      continue;
    }

    const key = `${result.packageManager}|${result.features}|${result.withCache}|${result.withPlaywrightCache}`;

    if (!groups.has(key)) {
      groups.set(key, {
        packageManager: result.packageManager,
        features: result.features,
        withCache: result.withCache,
        withPlaywrightCache: result.withPlaywrightCache,
        results: [],
      });
    }

    const group = groups.get(key)!;
    group.results.push({
      version: result.version,
      durationMean,
      durationMedian: parseFloat(result.durationMedian) || durationMean,
      durationMin: parseFloat(result.durationMin) || durationMean,
      durationMax: parseFloat(result.durationMax) || durationMean,
      durationStdDev: parseFloat(result.durationStdDev) || 0,
      success: result.success === "yes",
    });
  }

  return groups;
}

/**
 * Calculate percentage difference
 */
function calculatePercentageDiff(base: number, compare: number): number {
  if (base === 0) return compare === 0 ? 0 : Infinity;
  return ((compare - base) / base) * 100;
}

/**
 * Format percentage with sign and color indicator
 */
function formatPercentage(value: number): string {
  const sign = value >= 0 ? "+" : "";
  const color = value > 0 ? "🔴" : value < 0 ? "🟢" : "⚪";
  return `${color} ${sign}${value.toFixed(2)}%`;
}

/**
 * Sort versions for comparison (use first version as baseline)
 */
function sortVersions(versions: string[]): string[] {
  // Try to identify a baseline version (e.g., stable release)
  const baselinePatterns = [/^\d+\.\d+\.\d+$/, /^10\.0\./]; // e.g., "10.0.7"
  const baseline = versions.find((v) => baselinePatterns.some((p) => p.test(v)));

  if (baseline) {
    const others = versions.filter((v) => v !== baseline);
    return [baseline, ...others.sort()];
  }

  return versions.sort();
}

/**
 * Generate markdown summary
 */
function generateMarkdown(groups: Map<string, ConfigurationGroup>): string {
  const lines: string[] = [];

  lines.push("# Storybook Performance Comparison Summary");
  lines.push("");
  lines.push(`Generated on: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("## Overview");
  lines.push("");
  lines.push("This report compares Storybook initialization performance across different versions.");
  lines.push("Each section groups tests by configuration (package manager, features, cache settings).");
  lines.push("");

  // Sort groups for consistent output
  const sortedGroups = Array.from(groups.entries()).sort((a, b) => {
    const [keyA] = a;
    const [keyB] = b;
    return keyA.localeCompare(keyB);
  });

  for (const [key, group] of sortedGroups) {
    if (group.results.length < 2) {
      continue; // Skip groups with only one version
    }

    // Create section header
    const cacheLabel = group.withCache === "yes" ? "with cache" : "without cache";
    const playwrightLabel =
      group.withPlaywrightCache === "yes"
        ? "with Playwright cache"
        : group.withPlaywrightCache === "no"
          ? "without Playwright cache"
          : "";
    const cacheInfo = playwrightLabel ? `${cacheLabel}, ${playwrightLabel}` : cacheLabel;

    lines.push(`### ${group.packageManager} - ${group.features} (${cacheInfo})`);
    lines.push("");

    // Sort versions
    const versions = Array.from(new Set(group.results.map((r) => r.version)));
    const sortedVersions = sortVersions(versions);
    const baselineVersion = sortedVersions[0];

    // Find baseline result
    const baselineResult = group.results.find((r) => r.version === baselineVersion);
    if (!baselineResult) {
      continue;
    }

    // Create comparison table
    lines.push("| Version | Mean (s) | Median (s) | Min (s) | Max (s) | StdDev (s) | vs Baseline |");
    lines.push("|---------|---------|------------|---------|---------|------------|-------------|");

    // Add baseline row
    lines.push(
      `| **${baselineVersion}** (baseline) | ${baselineResult.durationMean.toFixed(2)} | ${baselineResult.durationMedian.toFixed(2)} | ${baselineResult.durationMin.toFixed(2)} | ${baselineResult.durationMax.toFixed(2)} | ${baselineResult.durationStdDev.toFixed(2)} | - |`
    );

    // Add comparison rows
    for (const version of sortedVersions.slice(1)) {
      const result = group.results.find((r) => r.version === version);
      if (!result) continue;

      const meanDiff = calculatePercentageDiff(baselineResult.durationMean, result.durationMean);
      const medianDiff = calculatePercentageDiff(baselineResult.durationMedian, result.durationMedian);

      // Use mean for comparison indicator
      const comparison = formatPercentage(meanDiff);

      lines.push(
        `| ${version} | ${result.durationMean.toFixed(2)} | ${result.durationMedian.toFixed(2)} | ${result.durationMin.toFixed(2)} | ${result.durationMax.toFixed(2)} | ${result.durationStdDev.toFixed(2)} | ${comparison} |`
      );
    }

    lines.push("");
  }

  // Add summary statistics
  lines.push("## Summary Statistics");
  lines.push("");
  lines.push("### Overall Performance by Version");
  lines.push("");

  // Aggregate statistics by version
  const versionStats = new Map<
    string,
    { count: number; totalMean: number; totalMedian: number; configs: Set<string> }
  >();

  for (const group of groups.values()) {
    for (const result of group.results) {
      if (!versionStats.has(result.version)) {
        versionStats.set(result.version, {
          count: 0,
          totalMean: 0,
          totalMedian: 0,
          configs: new Set(),
        });
      }

      const stats = versionStats.get(result.version)!;
      stats.count++;
      stats.totalMean += result.durationMean;
      stats.totalMedian += result.durationMedian;
      stats.configs.add(
        `${group.packageManager}|${group.features}|${group.withCache}|${group.withPlaywrightCache}`
      );
    }
  }

  // Calculate averages
  const versionAverages = Array.from(versionStats.entries())
    .map(([version, stats]) => ({
      version,
      avgMean: stats.totalMean / stats.count,
      avgMedian: stats.totalMedian / stats.count,
      configCount: stats.configs.size,
      testCount: stats.count,
    }))
    .sort((a, b) => a.avgMean - b.avgMean);

  lines.push("| Version | Avg Mean (s) | Avg Median (s) | Configurations | Tests |");
  lines.push("|---------|--------------|----------------|---------------|-------|");

  for (const avg of versionAverages) {
    lines.push(
      `| ${avg.version} | ${avg.avgMean.toFixed(2)} | ${avg.avgMedian.toFixed(2)} | ${avg.configCount} | ${avg.testCount} |`
    );
  }

  lines.push("");

  // Add comparison against fastest version
  if (versionAverages.length > 1) {
    const fastest = versionAverages[0];
    lines.push(`### Comparison vs Fastest Version (${fastest.version})`);
    lines.push("");
    lines.push("| Version | vs Fastest |");
    lines.push("|---------|------------|");

    for (const avg of versionAverages) {
      const diff = calculatePercentageDiff(fastest.avgMean, avg.avgMean);
      const comparison = formatPercentage(diff);
      lines.push(`| ${avg.version} | ${comparison} |`);
    }

    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Main function
 */
function main() {
  const csvPath = process.argv[2] || RESULTS_FILE;
  const outputPath = process.argv[3] || "benchmark-summary.md";

  console.log(`Reading CSV from: ${csvPath}`);
  const results = parseCSV(csvPath);
  console.log(`Parsed ${results.length} test results`);

  const groups = groupByConfiguration(results);
  console.log(`Grouped into ${groups.size} configuration groups`);

  const markdown = generateMarkdown(groups);
  writeFileSync(outputPath, markdown, "utf-8");
  console.log(`Markdown summary written to: ${outputPath}`);
}

main();

