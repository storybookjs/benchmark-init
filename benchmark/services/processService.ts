import { type ChildProcess, execSync, spawn } from "node:child_process";
import * as p from "@clack/prompts";
import type { BenchmarkResult } from "../types/index.js";

const activeChildProcesses = new Set<ChildProcess>();

/**
 * Get the active child processes Set for external tracking
 */
export function getActiveChildProcesses(): Set<ChildProcess> {
  return activeChildProcesses;
}

/**
 * Run a command and track the child process
 */
export function runCommand(
  command: string,
  options: {
    cwd?: string;
    stdio?: "inherit" | "pipe" | "ignore";
    env?: NodeJS.ProcessEnv;
  } = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    const parts = command.split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    const spawnOptions = {
      ...options,
      shell: true,
    };

    const child = spawn(cmd, args, spawnOptions);

    // Track this child process
    activeChildProcesses.add(child);

    child.on("exit", (code) => {
      activeChildProcesses.delete(child);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on("error", (error) => {
      activeChildProcesses.delete(child);
      reject(error);
    });
  });
}

/**
 * Kill all active child processes
 */
export function killAllChildProcesses(): void {
  if (activeChildProcesses.size === 0) {
    return;
  }

  console.log(`\nKilling ${activeChildProcesses.size} active child process(es)...`);

  const processesToKill = Array.from(activeChildProcesses);

  for (const child of processesToKill) {
    try {
      if (process.platform !== "win32" && child.pid) {
        // On Unix-like systems, kill the process and all its children
        // First kill the main process
        try {
          process.kill(child.pid, "SIGTERM");
        } catch (e) {
          // Process might already be dead
        }

        // Also kill all child processes using pkill (available on macOS)
        try {
          execSync(`pkill -P ${child.pid}`, { stdio: "ignore" });
        } catch (e) {
          // pkill might fail if no children exist, ignore
        }
      } else {
        // On Windows, just kill the process
        child.kill("SIGTERM");
      }
    } catch (error) {
      // Process might already be dead, ignore
    }
  }

  // Give processes a moment to exit gracefully, then force kill
  setTimeout(() => {
    for (const child of processesToKill) {
      try {
        if (process.platform !== "win32" && child.pid) {
          // Force kill the main process
          try {
            process.kill(child.pid, "SIGKILL");
          } catch (e) {
            // Ignore - process is already dead
          }

          // Force kill all child processes
          try {
            execSync(`pkill -9 -P ${child.pid}`, { stdio: "ignore" });
          } catch (e) {
            // Ignore - no children or already dead
          }
        } else {
          child.kill("SIGKILL");
        }
      } catch (e) {
        // Ignore - process is already dead
      }
    }
    activeChildProcesses.clear();
  }, 2000);
}

/**
 * Setup signal handlers to save results on abort and kill child processes
 * @param saveResultsCallback - Function to save results
 * @param results - Results array
 * @param setShouldSaveOnExit - Function to set shouldSaveOnExit flag
 */
export function setupSignalHandlers(
  saveResultsCallback: (append: boolean) => void,
  results: BenchmarkResult[],
  setShouldSaveOnExit: (value: boolean) => void
): void {
  const saveAndExit = (signal: string) => {
    p.log.warn(`\nReceived ${signal}. Cleaning up...`);

    // Kill all child processes first
    killAllChildProcesses();

    // Save partial results
    if (results.length > 0) {
      saveResultsCallback(true); // Append to existing results
      p.log.success(`Saved ${results.length} results before exit.`);
    }

    process.exit(0);
  };

  process.on("SIGINT", () => saveAndExit("SIGINT"));
  process.on("SIGTERM", () => saveAndExit("SIGTERM"));

  // Also handle uncaught exceptions and unhandled rejections
  process.on("uncaughtException", (error) => {
    console.error("\nUncaught exception:", error);
    killAllChildProcesses();
    process.exit(1);
  });

  process.on("unhandledRejection", (reason, promise) => {
    console.error("\nUnhandled rejection:", reason);
    killAllChildProcesses();
    process.exit(1);
  });

  setShouldSaveOnExit(true);
}
