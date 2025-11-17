import { existsSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CACHE_PATHS } from "../config.js";

/**
 * Clean package manager cache
 */
export function cleanPackageManagerCache(packageManager: string): void {
  const cachePaths = CACHE_PATHS[packageManager as keyof typeof CACHE_PATHS];
  if (!cachePaths) return;

  const pathsToClean = Array.isArray(cachePaths) ? cachePaths : [cachePaths];
  for (const cachePath of pathsToClean) {
    if (cachePath && existsSync(cachePath)) {
      console.log(`  Cleaning package manager cache: ${cachePath}`);
      rmSync(cachePath, { recursive: true, force: true });
    }
  }
}

/**
 * Clean Playwright cache
 */
export function cleanPlaywrightCache(): void {
  const playwrightPath = CACHE_PATHS.playwright;
  if (existsSync(playwrightPath)) {
    console.log(`  Cleaning playwright cache: ${playwrightPath}`);
    rmSync(playwrightPath, { recursive: true, force: true });
  }
}

/**
 * Create a temporary cache directory
 */
export function createTempCacheDir(): string {
  const tempCacheDir = join(
    tmpdir(),
    `benchmark-cache-${Date.now()}-${Math.random().toString(36).substring(7)}`
  );
  mkdirSync(tempCacheDir, { recursive: true });
  return tempCacheDir;
}

/**
 * Cleanup temporary cache directory
 */
export function cleanupTempCacheDir(tempCacheDir: string | null): void {
  if (tempCacheDir && existsSync(tempCacheDir)) {
    try {
      rmSync(tempCacheDir, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}
