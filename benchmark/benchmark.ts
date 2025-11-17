#!/usr/bin/env node

import { existsSync, rmSync, mkdirSync } from "fs";
import * as p from "@clack/prompts";
import { BENCHMARK_DIR, RESULTS_FILE } from "./config.js";

// Import services
import * as promptService from "./services/promptService.js";
import * as csvService from "./services/csvService.js";
import * as loggerService from "./services/loggerService.js";
import * as configService from "./services/configService.js";
import * as testRunnerService from "./services/testRunnerService.js";
import * as processService from "./services/processService.js";
import {
  removeResultsForTests,
  loadExistingResults,
} from "./services/csvService.js";
import { parseExistingResults } from "./services/csvService.js";
import type {
  BenchmarkState,
  BenchmarkConfig,
  BenchmarkResult,
} from "./types/index.js";

/**
 * Main execution
 */
async function main(): Promise<void> {
  p.intro("Storybook CLI Performance Benchmark");

  // Create shared state object
  const state: BenchmarkState = {
    results: [],
    iterationsPerTest: 1,
    enableSmokeTest: false,
    shouldSaveOnExit: false,
    resultsFile: RESULTS_FILE,
  };

  // Create services object
  const services = {
    promptService,
    csvService,
    loggerService,
    configService,
    testRunnerService,
    processService,
    statisticsService: await import("./services/statisticsService.js"),
    cacheService: await import("./services/cacheService.js"),
    fileSystemService: await import("./services/fileSystemService.js"),
  };

  // Setup signal handlers for graceful shutdown
  processService.setupSignalHandlers(
    (append) =>
      csvService.saveResults(state.results, state.resultsFile, append),
    state.results,
    (value) => {
      state.shouldSaveOnExit = value;
    }
  );

  // Create benchmark directory
  if (!existsSync(BENCHMARK_DIR)) {
    mkdirSync(BENCHMARK_DIR, { recursive: true });
  }

  // Prompt for versions to test
  const versions = await promptService.promptForVersions();
  p.log.info(`Selected ${versions.length} version(s) to test`);

  // Configure test combinations
  const selection = await promptService.promptForTestCombinations(versions);

  // Ask for number of iterations
  state.iterationsPerTest = await promptService.promptForIterations();
  p.log.info(`Each test configuration will run ${state.iterationsPerTest} time(s)`);

  // Ask if smoke tests should be enabled
  state.enableSmokeTest = await promptService.promptForSmokeTest();
  if (state.enableSmokeTest) {
    p.log.info("Smoke tests will be run after each successful Storybook init");
  } else {
    p.log.info("Smoke tests disabled");
  }

  // Handle rerun-failed mode
  if (selection && selection.mode === "rerun-failed") {
    if (!selection.failedConfigs || selection.failedConfigs.length === 0) {
      p.log.warn("No failed tests found in CSV. Exiting.");
      process.exit(0);
    }

    p.log.info(
      `Found ${selection.failedConfigs.length} failed test configuration(s) to rerun`
    );
    const configs = selection.failedConfigs;

    // Remove old results for tests being rerun
    const testsToRerun = new Set<string>(configs.map((c) => c.testId));
    removeResultsForTests(state.resultsFile, testsToRerun);
    p.log.info(`Removed ${testsToRerun.size} old result(s) from CSV`);

    // Run the failed tests
    state.shouldSaveOnExit = true;
    for (let i = 0; i < configs.length; i++) {
      const config = configs[i];
      console.log(
        `\n[${i + 1}/${configs.length}] Running failed test: ${config.testId}`
      );
      await testRunnerService.runBenchmark(config, state, services);
    }

    // Final save
    csvService.saveResults(state.results, state.resultsFile, false);
    p.outro("Rerun complete!");
    return;
  }

  // Generate test configurations based on selection
  const allConfigs =
    configService.generateConfigurationsFromSelection(selection, versions);

  // Check for existing results
  const { completed: completedTestIds, failed: failedTestIds } =
    parseExistingResults(state.resultsFile);
  const hasExistingResults = completedTestIds.size > 0;
  const incompleteTestIds = new Set<string>(
    allConfigs.map((c) => c.testId).filter((id) => !completedTestIds.has(id))
  );

  let configs: BenchmarkConfig[] = allConfigs;
  let startFromScratch = false;

  if (hasExistingResults) {
    p.log.info(
      `Found ${completedTestIds.size} completed tests in existing results.`
    );
    if (failedTestIds.size > 0) {
      p.log.warn(`${failedTestIds.size} test(s) failed previously.`);
    }

    const resumeMode = await promptService.promptForResumeMode(
      completedTestIds.size,
      failedTestIds.size,
      incompleteTestIds.size
    );

    if (resumeMode === "resume") {
      // Filter out completed tests
      configs = allConfigs.filter(
        (config) => !completedTestIds.has(config.testId)
      );
      p.log.success(
        `Resuming: ${configs.length} tests remaining (${completedTestIds.size} already completed)`
      );
    } else if (resumeMode === "rerun-failed") {
      // Only rerun failed tests
      configs = allConfigs.filter((config) =>
        failedTestIds.has(config.testId)
      );
      p.log.success(`Rerunning ${configs.length} failed test(s)`);
    } else if (resumeMode === "rerun-failed-and-resume") {
      // Rerun failed tests AND continue with incomplete ones
      configs = allConfigs.filter(
        (config) =>
          failedTestIds.has(config.testId) ||
          !completedTestIds.has(config.testId)
      );
      p.log.success(
        `Rerunning ${failedTestIds.size} failed test(s) and continuing with ${incompleteTestIds.size} incomplete test(s) (${configs.length} total)`
      );
    } else {
      startFromScratch = true;
      p.log.warn("Starting from scratch (will overwrite existing results)");
    }

    // Load existing results into memory (but exclude tests we're rerunning)
    if (
      resumeMode === "resume" ||
      resumeMode === "rerun-failed" ||
      resumeMode === "rerun-failed-and-resume"
    ) {
      const testsToRerun = new Set<string>(configs.map((c) => c.testId));
      const existingResults = loadExistingResults(
        state.resultsFile,
        testsToRerun
      );
      state.results.push(...existingResults);
    }
  } else {
    p.log.info(`Total test configurations: ${configs.length}`);
  }

  const totalIterations = configs.length * state.iterationsPerTest;
  await promptService.promptForConfirmation(
    `This will run ${configs.length} test configuration(s) with ${state.iterationsPerTest} iteration(s) each (${totalIterations} total runs). Continue?`,
    true
  );

  // Clear existing results if starting from scratch
  if (startFromScratch && hasExistingResults) {
    state.results.length = 0; // Clear loaded results
    if (existsSync(state.resultsFile)) {
      rmSync(state.resultsFile);
    }
  }

  // Run benchmarks
  let completed = 0;
  const totalToRun = configs.length;
  const alreadyCompleted = allConfigs.length - totalToRun;
  let totalRunsCompleted = 0;
  const totalRuns = totalToRun * state.iterationsPerTest;

  for (const config of configs) {
    try {
      await testRunnerService.runBenchmark(config, state, services);
      completed++;
      totalRunsCompleted += state.iterationsPerTest;
      loggerService.logProgress(
        completed,
        totalToRun,
        alreadyCompleted,
        allConfigs.length,
        totalRunsCompleted,
        totalRuns
      );
    } catch (error) {
      console.error(`\nFatal error in test ${config.testId}:`, error);
      // Check if test feature is selected
      const hasTestFeature = config.features.flags.includes("test");

      const errorRecord: BenchmarkResult = {
        testId: config.testId,
        version: config.version.name,
        packageManager: config.packageManager,
        features: config.features.name,
        withCache: config.withCache ? "yes" : "no",
        withPlaywrightCache: hasTestFeature
          ? config.withPlaywrightCache
            ? "yes"
            : "no"
          : "-",
        iterations: state.iterationsPerTest,
        successCount: 0,
        durationMean: "0.00",
        durationMedian: "0.00",
        durationMin: "0.00",
        durationMax: "0.00",
        durationStdDev: "0.00",
        success: "no",
        error: error instanceof Error ? error.message : String(error),
        smokeTestStatus: "-",
        smokeTestPassCount: "-",
        smokeTestFailCount: "-",
      };
      state.results.push(errorRecord);
      if (state.shouldSaveOnExit) {
        csvService.saveResults(state.results, state.resultsFile, true);
      }
    }
  }

  // Final save (will overwrite with complete results)
  csvService.saveResults(state.results, state.resultsFile, false);

  p.outro("Benchmark complete!");
}

// Run if executed directly
main();

