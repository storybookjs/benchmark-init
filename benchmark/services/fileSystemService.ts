import { cpSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { BENCHMARK_DIR, REACT_PROJECT } from "../config.js";

/**
 * Create a fresh copy of the react project for testing
 */
export function setupTestProject(testId: string): string {
  const testDir = join(BENCHMARK_DIR, testId);

  // Remove existing test directory if it exists
  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true });
  }

  // Copy react project
  cpSync(REACT_PROJECT, testDir, { recursive: true });

  return testDir;
}

/**
 * Clean up test project
 */
export function cleanupTestProject(testId: string): void {
  const testDir = join(BENCHMARK_DIR, testId);
  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true });
  }
}
