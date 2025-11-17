# Storybook CLI Performance Benchmark

This benchmark script tests the performance of Storybook CLI initialization across different configurations.

## Overview

The benchmark compares:
- **Old version**: `storybook@latest`
- **New version**: `storybook@0.0.0-pr-32717-sha-47ba2989`

## Test Matrix

The benchmark runs **128 test configurations** covering:

- **Versions**: latest, canary (2)
- **Package Managers**: yarn, yarn2, npm, bun (4)
- **Features**: 
  - a11y
  - a11y + test
  - a11y + docs
  - a11y + test + docs (4)
- **Cache Options**: with cache, without cache (2)
- **Playwright Cache**: with cache, without cache (2)

**Total: 2 × 4 × 4 × 2 × 2 = 128 tests**

## Usage

1. **Install dependencies** (only for the benchmark script):
   ```bash
   cd benchmark
   npm install
   ```

2. **Make sure the React project dependencies are NOT installed** (as specified)

3. **Run the benchmark script**:
   ```bash
   cd benchmark
   node benchmark.js
   ```
   
   Or use the npm script:
   ```bash
   cd benchmark
   npm run benchmark
   ```

4. **Choose your configuration**:
   - **Run all tests**: Runs all 128 test combinations
   - **Configure specific combinations**: Select specific versions, package managers, features, and cache options to test

5. **Confirm when prompted** - the script will ask for confirmation before running the selected tests

6. **Results will be saved** to `benchmark-results.csv` in the project root

## Output Format

The results CSV file contains the following columns:
- Test ID
- Version (latest/canary)
- Package Manager (yarn/yarn2/npm/bun)
- Features (a11y/a11y+test/etc.)
- With Cache (yes/no)
- With Playwright Cache (yes/no)
- Duration (s)
- Success (yes/no)
- Error (error message if any)

This format is optimized for importing into Notion or Google Sheets.

## Cache Management

The script automatically manages caches:
- **Without cache**: Removes the appropriate cache directory before each test
  - npm: `~/.npm/_npx`
  - yarn: `~/.yarn/cache`
  - bun: `~/.bun/install/cache`
  - playwright: `~/Library/Caches/ms-playwright`
- **With cache**: Leaves caches intact (they will be populated naturally during the first run)

## Notes

- Each test creates a fresh copy of the React project in `benchmark-runs/` directory
- Tests run sequentially (not in parallel) to ensure accurate timing
- The script cleans up test projects after each run
- Progress is displayed during execution

## Requirements

- Node.js (for running the benchmark script)
- The package managers you want to test (yarn, npm, bun) should be installed
- Sufficient disk space for temporary test projects

