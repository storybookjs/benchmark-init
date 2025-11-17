# Storybook CLI Performance Benchmark

This benchmark script tests the performance of Storybook CLI initialization across different configurations. The project is built with TypeScript and uses a modular service-based architecture.

## Overview

The benchmark measures Storybook CLI initialization performance across multiple dimensions:
- **Storybook versions** (configurable, default: `10.0.7` and `canary`)
- **Package managers**: yarn, yarn2 (berry), npm, bun
- **Feature combinations**: a11y, a11y+test, a11y+docs, a11y+test+docs
- **Cache configurations**: with/without package manager cache, with/without Playwright cache
- **Multiple iterations** per configuration for statistical analysis

## Features

- **Dynamic Version Selection**: Choose from default versions or add custom Storybook versions
- **Flexible Test Configuration**: Run all tests or configure specific combinations
- **Resume Functionality**: Continue from where you left off if the script is interrupted
- **Rerun Failed Tests**: Automatically detect and rerun failed tests, replacing entries step-by-step as they succeed
- **Smoke Tests**: Optional verification that Storybook builds successfully after initialization
- **Statistical Analysis**: Calculates mean, median, min, max, and standard deviation across multiple iterations
- **CSV Export**: Results saved in CSV format optimized for Notion and Google Sheets
- **Graceful Shutdown**: Saves partial results on interruption (Ctrl+C)
- **TypeScript**: Fully typed codebase with type safety
- **Biome Linting**: Code quality and formatting with Biome

## Installation

1. **Install dependencies** (only for the benchmark script):
   ```bash
   cd benchmark
   npm install
   # or
   pnpm install
   # or
   bun install
   ```

2. **Make sure the React project dependencies are NOT installed** (the benchmark script will handle this)

## Usage

### Running the Benchmark

```bash
cd benchmark
npm run benchmark
# or
bun benchmark.ts
```

### Interactive Configuration

The script will guide you through several prompts:

1. **Version Selection**:
   - Choose from default versions (`10.0.7`, `canary`)
   - Or add custom versions (e.g., `latest`, `0.0.0-pr-32717-sha-47ba2989`)

2. **Test Mode Selection**:
   - **Run all tests**: Executes all possible combinations
   - **Configure specific combinations**: Select specific versions, package managers, features, and cache options
   - **Rerun failed tests only**: Automatically detects failed tests from CSV and reruns them (only appears if failed tests exist)

3. **Iterations**: Specify how many times each test configuration should run (default: 1)

4. **Smoke Tests**: Choose whether to run `storybook -- --smoke-test` after each successful init (runs outside performance measurement)

5. **Resume Options** (if existing results found):
   - **Continue from last test**: Skip already completed tests
   - **Rerun failed tests only**: Rerun only tests that previously failed
   - **Rerun failed tests and continue**: Rerun failed tests and continue with incomplete ones
   - **Start from scratch**: Overwrite existing results

### Rerun Failed Tests Mode

When rerunning failed tests:
- Failed entries remain in the CSV initially
- As each test completes successfully, its entry is **replaced immediately** in the CSV
- If a rerun still fails, the original failed entry is kept
- Other successful entries are preserved

## Test Matrix

The benchmark can run up to **128 test configurations** (if all options are selected):

- **Versions**: Configurable (default: 2)
- **Package Managers**: yarn, yarn2, npm, bun (4)
- **Features**: 
  - a11y
  - a11y + test
  - a11y + docs
  - a11y + test + docs (4)
- **Cache Options**: with cache, without cache (2)
- **Playwright Cache**: with cache, without cache (2) - *only applies when `test` feature is selected*

**Total: Versions × 4 × 4 × 2 × 2 = up to 128 tests per version**

## Output Format

Results are saved to `benchmark-results.csv` in the project root with the following columns:

- **Test ID**: Unique identifier (e.g., `test-0001`)
- **Version**: Storybook version tested
- **Package Manager**: yarn/yarn2/npm/bun
- **Features**: Feature combination name
- **With Cache**: yes/no
- **With Playwright Cache**: yes/no (or `-` if test feature not selected)
- **Iterations**: Number of times the test ran
- **Success Count**: Number of successful iterations
- **Duration Mean (s)**: Average duration across iterations
- **Duration Median (s)**: Median duration
- **Duration Min (s)**: Minimum duration
- **Duration Max (s)**: Maximum duration
- **Duration StdDev (s)**: Standard deviation
- **Success**: yes/no/partial
- **Error**: Error message if any
- **Smoke Test Status**: passed/failed/partial/- (if smoke tests enabled)
- **Smoke Test Pass Count**: Number of successful smoke tests
- **Smoke Test Fail Count**: Number of failed smoke tests

This format is optimized for importing into Notion or Google Sheets.

## Cache Management

The script automatically manages caches:

### Package Manager Caches

**Without cache**: Removes cache directories before **every** iteration
- npm: `~/.npm/_npx`, `~/.npm/_cacache`
- yarn/yarn2: `~/.yarn/cache`, `~/.yarn/berry/cache`
- bun: `~/.bun/install/cache`

**With cache**: Uses existing caches (populated during first iteration)

### Playwright Cache

**Only managed when `test` feature is selected**

- **Without cache**: Removes `~/Library/Caches/ms-playwright` before every iteration
- **With cache**: Uses existing Playwright cache
- **Not applicable**: Shows `-` in CSV when test feature is not selected

### Cache Order

Tests always run **without cache first**, then **with cache** to ensure caches are properly populated.

## Project Structure

```
benchmark/
├── benchmark.ts          # Main entry point
├── config.ts            # Configuration constants
├── tsconfig.json        # TypeScript configuration
├── biome.json           # Biome linting configuration
├── package.json         # Dependencies and scripts
├── types/
│   └── index.ts         # TypeScript type definitions
└── services/
    ├── cacheService.ts       # Cache management
    ├── configService.ts      # Test configuration generation
    ├── csvService.ts         # CSV read/write/parse operations
    ├── fileSystemService.ts  # File operations
    ├── loggerService.ts      # Console logging
    ├── processService.ts     # Child process management
    ├── promptService.ts      # User interaction prompts
    ├── statisticsService.ts  # Statistical calculations
    └── testRunnerService.ts  # Benchmark execution logic
```

## Development

### Scripts

- `npm run benchmark` - Run the benchmark
- `npm run lint` - Check for linting issues
- `npm run lint:fix` - Auto-fix linting issues
- `npm run format` - Format code with Biome

### Code Quality

The project uses:
- **TypeScript** for type safety
- **Biome** for linting and formatting
- **Service-based architecture** for modularity and testability

## Technical Details

### Command Execution

The script uses different commands based on package manager:

- **bun**: `bunx storybook@<version> init --flags`
- **yarn2** (berry): `yarn dlx storybook@<version> init --flags`
- **yarn** (classic): `npx storybook@<version> init --flags`
- **pnpm**: `pnpm create storybook@<version> --flags`
- **npm**: `npm create storybook@<version> --flags`

Note: The `--` separator is used for `npm create` and `pnpm create` commands to properly pass flags to the underlying script.

### Yarn 2 (Berry) Setup

When testing with `yarn2`, the script automatically:
1. Runs `yarn set version berry`
2. Creates `.yarnrc.yml` with `nodeLinker: node-modules`
3. Runs `yarn install --mode=update-lockfile`

### Process Management

- Child processes are tracked and can be killed gracefully
- On interruption (Ctrl+C), all child processes are terminated
- Partial results are saved automatically

### Environment Variables

- `CI=true` is set during all benchmark runs
- Temporary cache directories are used for "without cache" tests
- Package manager-specific cache environment variables are configured

## Requirements

- Node.js 18+ (for running the benchmark script)
- TypeScript 5.0+
- The package managers you want to test (yarn, npm, bun) should be installed
- Sufficient disk space for temporary test projects in `benchmark-runs/`

## Notes

- Each test creates a fresh copy of the React project in `benchmark-runs/` directory
- Tests run sequentially (not in parallel) to ensure accurate timing
- The script cleans up test projects after each run
- Progress is displayed during execution with detailed statistics
- Smoke tests run **outside** the performance measurement time
- Failed test entries are replaced step-by-step as reruns succeed
