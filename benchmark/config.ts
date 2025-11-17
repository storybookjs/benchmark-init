import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { FeatureCombination, Version } from "./types/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// PROJECT_ROOT is the parent directory (one level up from benchmark folder)
export const PROJECT_ROOT: string = join(__dirname, "..");
export const REACT_PROJECT: string = join(PROJECT_ROOT, "react");
export const BENCHMARK_DIR: string = join(PROJECT_ROOT, "benchmark-runs");
export const RESULTS_FILE: string = join(PROJECT_ROOT, "benchmark-results.csv");

// Default version suggestions (user can add more)
export const DEFAULT_VERSION_SUGGESTIONS: Version[] = [
  { name: "10.0.7", command: "storybook@10.0.7" },
  { name: "canary", command: "storybook@0.0.0-pr-32717-sha-47ba2989" },
];

export const PACKAGE_MANAGERS: readonly string[] = ["yarn", "yarn2", "npm", "bun"];

export const FEATURE_COMBINATIONS: readonly FeatureCombination[] = [
  { name: "a11y", flags: ["--features", "a11y"] },
  { name: "a11y+test", flags: ["--features", "a11y", "--features", "test"] },
  { name: "a11y+docs", flags: ["--features", "a11y", "--features", "docs"] },
  {
    name: "a11y+test+docs",
    flags: ["--features", "a11y", "--features", "test", "--features", "docs"],
  },
] as const;

// Order matters: run without cache first to populate cache, then with cache to use it
export const CACHE_OPTIONS: readonly boolean[] = [false, true]; // without cache first, then with cache
export const PLAYWRIGHT_CACHE_OPTIONS: readonly boolean[] = [false, true]; // without cache first, then with cache

// Cache paths - comprehensive list for each package manager
export const CACHE_PATHS: {
  npm: string[];
  yarn: string[];
  yarn2: string[];
  bun: string[];
  playwright: string;
} = {
  npm: [join(homedir(), ".npm", "_npx"), join(homedir(), ".npm", "_cacache")],
  yarn: [join(homedir(), ".yarn", "cache"), join(homedir(), ".yarn", "berry", "cache")],
  yarn2: [join(homedir(), ".yarn", "cache"), join(homedir(), ".yarn", "berry", "cache")],
  bun: [join(homedir(), ".bun", "install", "cache")],
  playwright: join(homedir(), "Library", "Caches", "ms-playwright"),
};
