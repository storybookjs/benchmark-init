import * as p from "@clack/prompts";
import { isCancel } from "@clack/prompts";
import { DEFAULT_VERSION_SUGGESTIONS, FEATURE_COMBINATIONS, PACKAGE_MANAGERS } from "../config.js";
import { RESULTS_FILE } from "../config.js";
import type { TestSelection, Version } from "../types/index.js";
import { parseExistingResults } from "./csvService.js";

/**
 * Prompt for Storybook versions to test
 */
export async function promptForVersions(): Promise<Version[]> {
  // First, ask if they want to use default suggestions or add custom versions
  // Show available default versions
  const defaultVersionList = DEFAULT_VERSION_SUGGESTIONS.map(
    (v) => `  • ${v.name} (${v.command})`
  ).join("\n");

  const versionMode = await p.select({
    message: `How would you like to select Storybook versions?\n\nAvailable default versions:\n${defaultVersionList}\n`,
    options: [
      { value: "defaults", label: "Use default suggestions" },
      { value: "custom", label: "Add custom versions" },
    ],
  });

  if (isCancel(versionMode)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  let versions: Version[] = [];

  if (versionMode === "defaults") {
    // Show default suggestions and let user select
    const selectedDefaultVersions = await p.multiselect({
      message: "Select Storybook versions to test:",
      options: DEFAULT_VERSION_SUGGESTIONS.map((v) => ({
        value: v.name,
        label: `${v.name} (${v.command})`,
      })),
      required: true,
    });

    if (isCancel(selectedDefaultVersions)) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }

    versions = DEFAULT_VERSION_SUGGESTIONS.filter((v) => selectedDefaultVersions.includes(v.name));
  } else {
    // Allow user to add custom versions
    const customVersions: Version[] = [];
    let addMore = true;
    let versionNumber = 1;

    p.log.info(
      "You can add multiple versions. After each version, you'll be asked if you want to add another."
    );

    while (addMore) {
      const versionName = await p.text({
        message: `Enter version ${versionNumber} (e.g., '10.0.7', 'canary', 'latest', '0.0.0-pr-32717-sha-47ba2989'):`,
        placeholder: "10.0.7",
        validate(value) {
          if (!value || value.trim().length === 0) {
            return "Version is required";
          }
          // Check for duplicates
          if (customVersions.some((v) => v.name === value.trim())) {
            return "Version already added";
          }
        },
      });

      if (isCancel(versionName)) {
        p.cancel("Operation cancelled.");
        process.exit(0);
      }

      const trimmedVersion = versionName.trim();
      const versionCommand = `storybook@${trimmedVersion}`;

      customVersions.push({
        name: trimmedVersion,
        command: versionCommand,
      });

      p.log.success(`Added version: ${trimmedVersion} (${versionCommand})`);

      if (customVersions.length > 0) {
        const continueAdding = await p.confirm({
          message: `Add another version? (Currently have ${customVersions.length} version(s))`,
          initialValue: true,
        });

        if (isCancel(continueAdding)) {
          p.cancel("Operation cancelled.");
          process.exit(0);
        }

        addMore = continueAdding;
        versionNumber++;
      } else {
        addMore = false;
      }
    }

    versions = customVersions;
  }

  return versions;
}

/**
 * Configure which test combinations to run
 */
export async function promptForTestCombinations(
  versions: Version[]
): Promise<TestSelection | null> {
  // Check if there are existing results with failed tests
  const { failed: failedTestIds, failedConfigs } = parseExistingResults(RESULTS_FILE);
  const hasFailedTests = failedTestIds.size > 0;

  const runModeOptions: Array<{
    value: string;
    label: string;
    hint?: string;
  }> = [
    { value: "all", label: "Run all tests" },
    { value: "configure", label: "Configure specific combinations" },
  ];

  if (hasFailedTests) {
    runModeOptions.push({
      value: "rerun-failed",
      label: "Rerun failed tests only",
      hint: `${failedTestIds.size} failed test(s) found in CSV`,
    });
  }

  const runMode = await p.select({
    message: "How would you like to run the benchmarks?",
    options: runModeOptions,
  });

  if (isCancel(runMode)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  if (runMode === "all") {
    return null; // null means run all
  }

  if (runMode === "rerun-failed") {
    return { mode: "rerun-failed", failedConfigs };
  }

  // Configure specific combinations
  const selectedVersions = await p.multiselect({
    message: "Select Storybook versions to test:",
    options: versions.map((v) => ({
      value: v.name,
      label: `${v.name} (${v.command})`,
    })),
    required: true,
  });

  if (isCancel(selectedVersions)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  const selectedPackageManagers = await p.multiselect({
    message: "Select package managers to test:",
    options: PACKAGE_MANAGERS.map((pm) => ({
      value: pm,
      label: pm,
    })),
    required: true,
  });

  if (isCancel(selectedPackageManagers)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  const selectedFeatures = await p.multiselect({
    message: "Select feature combinations to test:",
    options: FEATURE_COMBINATIONS.map((f) => ({
      value: f.name,
      label: f.name,
    })),
    required: true,
  });

  if (isCancel(selectedFeatures)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  const selectedCacheOptions = await p.multiselect({
    message: "Select cache options to test:",
    options: [
      { value: true, label: "With cache" },
      { value: false, label: "Without cache" },
    ],
    required: true,
  });

  if (isCancel(selectedCacheOptions)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  const selectedPlaywrightCacheOptions = await p.multiselect({
    message: "Select Playwright cache options to test:",
    options: [
      { value: true, label: "With Playwright cache" },
      { value: false, label: "Without Playwright cache" },
    ],
    required: true,
  });

  if (isCancel(selectedPlaywrightCacheOptions)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  return {
    versions: selectedVersions,
    packageManagers: selectedPackageManagers,
    features: selectedFeatures,
    cacheOptions: selectedCacheOptions,
    playwrightCacheOptions: selectedPlaywrightCacheOptions,
  };
}

/**
 * Prompt for number of iterations
 */
export async function promptForIterations(): Promise<number> {
  const iterationsInput = await p.text({
    message: "How many times should each test configuration run?",
    placeholder: "1",
    initialValue: "1",
    validate(value) {
      if (!value) {
        return "Please enter a number greater than 0";
      }
      const num = Number.parseInt(value, 10);
      if (Number.isNaN(num) || num < 1) {
        return "Please enter a number greater than 0";
      }
      if (num > 100) {
        return "Please enter a number less than or equal to 100";
      }
    },
  });

  if (isCancel(iterationsInput)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  return Number.parseInt(iterationsInput, 10);
}

/**
 * Prompt for smoke test enablement
 */
export async function promptForSmokeTest(): Promise<boolean> {
  const enableSmokeTestInput = await p.confirm({
    message: "Run smoke tests after Storybook init? (storybook -- --smoke-test)",
    initialValue: false,
  });

  if (isCancel(enableSmokeTestInput)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  return enableSmokeTestInput;
}

/**
 * Prompt for resume mode
 */
export async function promptForResumeMode(
  completedCount: number,
  failedCount: number,
  incompleteCount: number
): Promise<string> {
  const resumeMode = await p.select({
    message: "How would you like to proceed?",
    options: [
      {
        value: "resume",
        label: "Continue from last test (resume)",
        hint: `${incompleteCount} incomplete tests remaining`,
      },
      {
        value: "rerun-failed",
        label: "Rerun failed tests only",
        hint: `${failedCount} failed test(s) to rerun`,
        disabled: failedCount === 0,
      },
      {
        value: "rerun-failed-and-resume",
        label: "Rerun failed tests and continue",
        hint: `${failedCount} failed + ${incompleteCount} incomplete tests`,
        disabled: failedCount === 0 && incompleteCount === 0,
      },
      {
        value: "scratch",
        label: "Start from scratch (overwrite)",
        hint: "Will delete existing results",
      },
    ],
  });

  if (isCancel(resumeMode)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  return resumeMode as string;
}

/**
 * Prompt for confirmation
 */
export async function promptForConfirmation(
  message: string,
  initialValue = true
): Promise<boolean> {
  const shouldContinue = await p.confirm({
    message,
    initialValue,
  });

  if (isCancel(shouldContinue) || !shouldContinue) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  return shouldContinue;
}
