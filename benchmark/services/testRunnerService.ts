import { type ChildProcess, spawn } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type {
  BenchmarkConfig,
  BenchmarkResult,
  BenchmarkState,
  SmokeTestResult,
  Statistics,
  TestResult,
} from "../types/index.js";
import {
  cleanPackageManagerCache,
  cleanPlaywrightCache,
  cleanupTempCacheDir,
  createTempCacheDir,
} from "./cacheService.js";
import { cleanupTestProject, setupTestProject } from "./fileSystemService.js";
import { logBenchmarkResult, logBenchmarkStart, logSmokeTestResult } from "./loggerService.js";
import { calculateStatistics } from "./statisticsService.js";

interface Services {
  loggerService: typeof import("./loggerService.js");
  cacheService: typeof import("./cacheService.js");
  fileSystemService: typeof import("./fileSystemService.js");
  testRunnerService: typeof import("./testRunnerService.js");
  processService: typeof import("./processService.js");
  statisticsService: typeof import("./statisticsService.js");
  csvService: typeof import("./csvService.js");
}

/**
 * Setup yarn2 (berry) for the test project
 */
export async function setupYarn2(
  testDir: string,
  processService: typeof import("./processService.js")
): Promise<boolean> {
  console.log("  Setting up Yarn 2 (berry)...");

  try {
    // Create .yarnrc.yml first with nodeLinker: node-modules
    // This ensures yarn uses node_modules linker and allows lockfile operations
    const yarnrcPath = join(testDir, ".yarnrc.yml");
    const yarnrcContent = `nodeLinker: node-modules
enableImmutableInstalls: false
`;
    writeFileSync(yarnrcPath, yarnrcContent);

    // Run yarn set version berry
    await processService.runCommand("yarn set version berry", {
      cwd: testDir,
      stdio: "pipe", // Use pipe to reduce noise
      env: {
        ...process.env,
        CI: "true",
      },
    });

    // Initialize yarn project by running install with explicit lockfile update mode
    // This ensures the lockfile is created and yarn allows updates
    await processService.runCommand("yarn install --mode=update-lockfile", {
      cwd: testDir,
      stdio: "pipe", // Use pipe to avoid cluttering output
      env: {
        ...process.env,
        CI: "true",
        // Explicitly allow lockfile operations
        YARN_ENABLE_IMMUTABLE_INSTALLS: "false",
      },
    });

    console.log("  Yarn 2 setup complete");
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`  Error setting up Yarn 2: ${errorMessage}`);
    return false;
  }
}

/**
 * Generate the Storybook init command based on package manager and configuration
 */
export function generateStorybookCommand(
  version: { name: string; command: string },
  packageManager: string,
  features: { name: string; flags: string[] }
): string {
  const flags = ["--yes", "--no-dev", `--package-manager=${packageManager}`, ...features.flags];
  const flagsString = flags.join(" ");

  switch (packageManager) {
    case "bun":
      return `bunx ${version.command} init ${flagsString}`;
    case "yarn2":
      // Use yarn dlx for yarn2 (berry) with versioned packages
      return `yarn dlx ${version.command} init ${flagsString}`;
    case "yarn":
      // Use npx for yarn (classic) - yarn dlx doesn't work well with yarn classic
      return `npx ${version.command} init ${flagsString}`;
    case "pnpm":
      return `pnpm create ${version.command} ${flagsString}`;
    case "npm":
      return `npm create ${version.command} -- ${flagsString}`;
    default:
      // Fallback to npx for unknown package managers
      return `npx ${version.command} init ${flagsString}`;
  }
}

/**
 * Run Storybook init command and measure time
 * Note: This function uses spawn directly to track processes and measure duration.
 * The spawned processes should be tracked by processService for cleanup.
 */
export function runStorybookInit(
  testDir: string,
  version: { name: string; command: string },
  packageManager: string,
  features: { name: string; flags: string[] },
  withCache: boolean,
  cacheService: typeof import("./cacheService.js"),
  processTracker: Set<ChildProcess>
): Promise<TestResult> {
  const fullCommand = generateStorybookCommand(version, packageManager, features);

  console.log(`  Running: ${fullCommand}`);

  const startTime = Date.now();

  // Build environment variables
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    CI: "true",
    // Ensure we're using the correct package manager
    npm_config_user_agent: undefined,
  };

  let tempCacheDir: string | null = null;

  // Disable caching via environment variables when testing without cache
  if (!withCache) {
    // Use a temporary cache directory that gets cleared after each run
    // This ensures no cache persists between iterations
    tempCacheDir = cacheService.createTempCacheDir();

    // npm cache settings - use temporary directory
    env.npm_config_cache = tempCacheDir;
    env.NPM_CONFIG_CACHE = tempCacheDir;

    // yarn cache settings - disable global cache and use temp dir
    env.YARN_CACHE_FOLDER = tempCacheDir;
    env.YARN_ENABLE_GLOBAL_CACHE = "false";

    // bun cache settings - use temporary directory
    env.BUN_INSTALL_CACHE = tempCacheDir;
  }

  return new Promise((resolve) => {
    // Spawn process and track it so we can kill it and its children
    const spawnOptions = {
      cwd: testDir,
      stdio: "inherit" as const,
      env,
      shell: true, // Use shell to handle complex commands like npx
    };

    // On Unix-like systems, wrap command to create a new process group
    // This allows us to kill all children by killing the process group
    let commandToRun = fullCommand;
    if (process.platform !== "win32") {
      // Use a shell command that creates a new process group
      // The shell's job control creates a process group automatically
      // We'll track the shell PID and kill it, which should kill children
      commandToRun = fullCommand;
    }

    const child = spawn(commandToRun, [], spawnOptions);

    // Track this child process if tracker is provided
    if (processTracker) {
      processTracker.add(child);
    }

    // Remove from tracking when process exits
    child.on("exit", () => {
      if (processTracker) {
        processTracker.delete(child);
      }
    });

    child.on("error", (error) => {
      if (processTracker) {
        processTracker.delete(child);
      }
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;

      // Clean up temp cache directory
      cacheService.cleanupTempCacheDir(tempCacheDir);

      console.error(`  Error: ${error.message}`);
      resolve({ success: false, duration, error: error.message });
    });

    child.on("close", (code) => {
      if (processTracker) {
        processTracker.delete(child);
      }
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;

      // Clean up temp cache directory
      cacheService.cleanupTempCacheDir(tempCacheDir);

      if (code === 0) {
        resolve({ success: true, duration });
      } else {
        resolve({
          success: false,
          duration,
          error: `Process exited with code ${code}`,
        });
      }
    });
  });
}

/**
 * Run Storybook smoke test
 */
export function runSmokeTest(
  testDir: string,
  packageManager: string,
  processTracker: Set<ChildProcess>
): Promise<SmokeTestResult> {
  // Use correct command format for each package manager
  let command: string;
  if (packageManager === "npm") {
    command = "npm run storybook -- --smoke-test";
  } else if (packageManager === "yarn" || packageManager === "yarn2") {
    command = "yarn storybook -- --smoke-test";
  } else if (packageManager === "bun") {
    command = "bun run storybook -- --smoke-test";
  } else {
    command = `${packageManager} storybook -- --smoke-test`;
  }
  console.log(`  Running smoke test: ${command}`);

  const startTime = Date.now();

  return new Promise((resolve) => {
    const spawnOptions = {
      cwd: testDir,
      stdio: "pipe" as const, // Capture output instead of inheriting
      env: {
        ...process.env,
        CI: "true",
      },
      shell: true,
    };

    const child = spawn(command, [], spawnOptions);
    if (processTracker) {
      processTracker.add(child);
    }

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("exit", (code) => {
      if (processTracker) {
        processTracker.delete(child);
      }
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;

      if (code === 0) {
        resolve({ success: true, duration });
      } else {
        resolve({
          success: false,
          duration,
          error: `Smoke test failed with exit code ${code}`,
          stdout,
          stderr,
        });
      }
    });

    child.on("error", (error) => {
      if (processTracker) {
        processTracker.delete(child);
      }
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      resolve({
        success: false,
        duration,
        error: error.message,
        stdout,
        stderr,
      });
    });
  });
}

/**
 * Run a single benchmark test iteration
 */
export async function runBenchmarkIteration(
  config: BenchmarkConfig,
  iteration: number,
  state: BenchmarkState,
  services: Services
): Promise<TestResult> {
  const { version, packageManager, features, withCache, withPlaywrightCache, testId } = config;

  const { loggerService, cacheService, fileSystemService, testRunnerService, processService } =
    services;

  loggerService.logBenchmarkStart(config, iteration, state.iterationsPerTest);

  // Clean caches if needed
  // For "without cache" tests: clean before EVERY iteration to ensure no cache is used
  // For "with cache" tests: only clean on first iteration to populate cache, then use it
  if (!withCache) {
    // Clean package manager cache before every iteration when testing without cache
    cacheService.cleanPackageManagerCache(packageManager);
  }

  // Only manage Playwright cache if test feature is selected
  // Check if "test" appears in the features flags array
  const hasTestFeature = features.flags.includes("test");

  if (hasTestFeature) {
    if (!withPlaywrightCache) {
      // Clean playwright cache before every iteration when testing without cache
      cacheService.cleanPlaywrightCache();
    }
  }

  // Setup test project (use testId + iteration to avoid conflicts)
  const iterationTestId = `${testId}-iter${iteration}`;
  const testDir = fileSystemService.setupTestProject(iterationTestId);

  try {
    // Setup yarn2 if needed
    if (packageManager === "yarn2") {
      const yarn2SetupSuccess = await testRunnerService.setupYarn2(testDir, processService);
      if (!yarn2SetupSuccess) {
        return {
          success: false,
          duration: 0,
          error: "Failed to setup Yarn 2",
        };
      }
    }

    // Run Storybook init
    const result = await testRunnerService.runStorybookInit(
      testDir,
      version,
      packageManager,
      features,
      withCache,
      cacheService,
      services.processService.getActiveChildProcesses()
    );

    loggerService.logBenchmarkResult(result, result.duration);

    // Run smoke test if enabled and init was successful
    let smokeTestResult: SmokeTestResult | undefined = undefined;
    if (state.enableSmokeTest && result.success) {
      smokeTestResult = await testRunnerService.runSmokeTest(
        testDir,
        packageManager,
        services.processService.getActiveChildProcesses()
      );
      loggerService.logSmokeTestResult(smokeTestResult);
    }

    return {
      ...result,
      smokeTest: smokeTestResult,
    };
  } finally {
    // Cleanup test project
    fileSystemService.cleanupTestProject(iterationTestId);
  }
}

/**
 * Run a benchmark test configuration multiple times and collect statistics
 */
export async function runBenchmark(
  config: BenchmarkConfig,
  state: BenchmarkState,
  services: Services
): Promise<BenchmarkResult> {
  const { version, packageManager, features, withCache, withPlaywrightCache, testId } = config;

  const { loggerService, statisticsService, csvService } = services;

  const durations: number[] = [];
  const errors: string[] = [];
  let successCount = 0;
  const smokeTestResults: SmokeTestResult[] = []; // Track smoke test results

  // Run the test multiple times
  for (let i = 0; i < state.iterationsPerTest; i++) {
    const result = await runBenchmarkIteration(config, i, state, services);

    if (result.success) {
      durations.push(result.duration);
      successCount++;
    } else {
      errors.push(result.error || "Unknown error");
    }

    // Track smoke test results
    if (state.enableSmokeTest && result.smokeTest) {
      smokeTestResults.push(result.smokeTest);
    }
  }

  // Calculate statistics
  const stats: Statistics = statisticsService.calculateStatistics(durations);
  const allSuccess = successCount === state.iterationsPerTest;
  const allFailed = successCount === 0;
  const errorMessage =
    allFailed && errors.length > 0
      ? errors[0] // Use first error if all failed
      : errors.length > 0
        ? `${errors.length} iteration(s) failed`
        : "";

  // Check if test feature is selected
  const hasTestFeature = features.flags.includes("test");

  // Calculate smoke test statistics
  const smokeTestPassCount = smokeTestResults.filter((r) => r.success).length;
  const smokeTestFailCount = smokeTestResults.filter((r) => !r.success).length;
  const smokeTestStatus =
    state.enableSmokeTest && smokeTestResults.length > 0
      ? smokeTestPassCount === smokeTestResults.length
        ? "passed"
        : smokeTestFailCount === smokeTestResults.length
          ? "failed"
          : "partial"
      : "-";

  // Generate the command that was run (reuse the same logic)
  const command = generateStorybookCommand(version, packageManager, features);

  // Record result with statistics
  const record: BenchmarkResult = {
    testId,
    version: version.name,
    packageManager,
    features: features.name,
    withCache: withCache ? "yes" : "no",
    withPlaywrightCache: hasTestFeature ? (withPlaywrightCache ? "yes" : "no") : "-",
    iterations: state.iterationsPerTest,
    successCount,
    durationMean: stats.mean,
    durationMedian: stats.median,
    durationMin: stats.min,
    durationMax: stats.max,
    durationStdDev: stats.stdDev,
    success: allSuccess ? "yes" : allFailed ? "no" : "partial",
    error: errorMessage,
    smokeTestStatus,
    smokeTestPassCount: state.enableSmokeTest ? smokeTestPassCount : "-",
    smokeTestFailCount: state.enableSmokeTest ? smokeTestFailCount : "-",
    command,
  };

  state.results.push(record);

  // Save results after each test (append mode to preserve partial results)
  if (state.shouldSaveOnExit) {
    csvService.saveResults(state.results, state.resultsFile, true);
  }

  loggerService.logSummary(
    stats,
    successCount,
    state.iterationsPerTest,
    smokeTestResults,
    state.enableSmokeTest
  );

  return record;
}
