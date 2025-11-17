# Storybook Performance Comparison Summary

Generated on: 2025-11-17T09:23:18.983Z

## Overview

This report compares Storybook initialization performance across different versions.
Each section groups tests by configuration (package manager, features, cache settings).

### bun - a11y+docs (without cache)

| Version | Mean (s) | Median (s) | Min (s) | Max (s) | StdDev (s) | vs Baseline |
|---------|---------|------------|---------|---------|------------|-------------|
| **10.0.7** (baseline) | 14.80 | 14.80 | 14.31 | 15.29 | 0.49 | - |
| 0.0.0-pr-32717-sha-47ba2989 | 13.13 | 13.13 | 12.54 | 13.71 | 0.58 | 🟢 -11.28% |
| 10.1.0-alpha.10 | 15.13 | 15.13 | 14.91 | 15.35 | 0.22 | 🔴 +2.23% |

### bun - a11y+docs (with cache)

| Version | Mean (s) | Median (s) | Min (s) | Max (s) | StdDev (s) | vs Baseline |
|---------|---------|------------|---------|---------|------------|-------------|
| **10.0.7** (baseline) | 5.53 | 5.53 | 4.28 | 6.78 | 1.25 | - |
| 0.0.0-pr-32717-sha-47ba2989 | 4.80 | 4.80 | 4.58 | 5.01 | 0.21 | 🟢 -13.20% |
| 10.1.0-alpha.10 | 5.00 | 5.00 | 4.88 | 5.11 | 0.11 | 🟢 -9.58% |

### bun - a11y+test+docs (without cache, without Playwright cache)

| Version | Mean (s) | Median (s) | Min (s) | Max (s) | StdDev (s) | vs Baseline |
|---------|---------|------------|---------|---------|------------|-------------|
| **10.0.7** (baseline) | 45.69 | 45.69 | 44.35 | 47.03 | 1.34 | - |
| 0.0.0-pr-32717-sha-47ba2989 | 36.26 | 36.26 | 35.80 | 36.71 | 0.45 | 🟢 -20.64% |
| 10.1.0-alpha.10 | 49.25 | 49.25 | 48.67 | 49.84 | 0.58 | 🔴 +7.79% |

### bun - a11y+test+docs (without cache, with Playwright cache)

| Version | Mean (s) | Median (s) | Min (s) | Max (s) | StdDev (s) | vs Baseline |
|---------|---------|------------|---------|---------|------------|-------------|
| **10.0.7** (baseline) | 35.64 | 35.64 | 35.17 | 36.11 | 0.47 | - |
| 0.0.0-pr-32717-sha-47ba2989 | 25.60 | 25.60 | 24.75 | 26.45 | 0.85 | 🟢 -28.17% |
| 10.1.0-alpha.10 | 35.57 | 35.57 | 33.74 | 37.40 | 1.83 | 🟢 -0.20% |

### bun - a11y+test+docs (with cache, without Playwright cache)

| Version | Mean (s) | Median (s) | Min (s) | Max (s) | StdDev (s) | vs Baseline |
|---------|---------|------------|---------|---------|------------|-------------|
| **10.0.7** (baseline) | 30.60 | 30.60 | 27.15 | 34.06 | 3.46 | - |
| 0.0.0-pr-32717-sha-47ba2989 | 24.63 | 24.63 | 21.90 | 27.36 | 2.73 | 🟢 -19.51% |
| 10.1.0-alpha.10 | 32.02 | 32.02 | 27.04 | 37.01 | 4.99 | 🔴 +4.64% |

### bun - a11y+test+docs (with cache, with Playwright cache)

| Version | Mean (s) | Median (s) | Min (s) | Max (s) | StdDev (s) | vs Baseline |
|---------|---------|------------|---------|---------|------------|-------------|
| **10.0.7** (baseline) | 16.86 | 16.86 | 16.50 | 17.21 | 0.35 | - |
| 0.0.0-pr-32717-sha-47ba2989 | 11.54 | 11.54 | 11.38 | 11.69 | 0.15 | 🟢 -31.55% |
| 10.1.0-alpha.10 | 16.80 | 16.80 | 16.72 | 16.88 | 0.08 | 🟢 -0.36% |

### npm - a11y+docs (without cache)

| Version | Mean (s) | Median (s) | Min (s) | Max (s) | StdDev (s) | vs Baseline |
|---------|---------|------------|---------|---------|------------|-------------|
| **10.0.7** (baseline) | 24.52 | 24.52 | 24.52 | 24.52 | 0.00 | - |
| 0.0.0-pr-32717-sha-47ba2989 | 21.32 | 21.32 | 21.32 | 21.32 | 0.00 | 🟢 -13.05% |
| 10.1.0-alpha.10 | 22.29 | 22.29 | 22.29 | 22.29 | 0.00 | 🟢 -9.09% |

### npm - a11y+docs (with cache)

| Version | Mean (s) | Median (s) | Min (s) | Max (s) | StdDev (s) | vs Baseline |
|---------|---------|------------|---------|---------|------------|-------------|
| **10.0.7** (baseline) | 23.14 | 23.14 | 23.14 | 23.14 | 0.00 | - |
| 0.0.0-pr-32717-sha-47ba2989 | 21.80 | 21.80 | 21.80 | 21.80 | 0.00 | 🟢 -5.79% |
| 10.1.0-alpha.10 | 21.44 | 21.44 | 21.44 | 21.44 | 0.00 | 🟢 -7.35% |

### npm - a11y+test+docs (without cache, without Playwright cache)

| Version | Mean (s) | Median (s) | Min (s) | Max (s) | StdDev (s) | vs Baseline |
|---------|---------|------------|---------|---------|------------|-------------|
| **10.0.7** (baseline) | 60.33 | 60.33 | 60.33 | 60.33 | 0.00 | - |
| 0.0.0-pr-32717-sha-47ba2989 | 48.72 | 48.72 | 48.72 | 48.72 | 0.00 | 🟢 -19.24% |
| 10.1.0-alpha.10 | 60.03 | 60.03 | 60.03 | 60.03 | 0.00 | 🟢 -0.50% |

### npm - a11y+test+docs (without cache, with Playwright cache)

| Version | Mean (s) | Median (s) | Min (s) | Max (s) | StdDev (s) | vs Baseline |
|---------|---------|------------|---------|---------|------------|-------------|
| **10.0.7** (baseline) | 47.08 | 47.08 | 47.08 | 47.08 | 0.00 | - |
| 0.0.0-pr-32717-sha-47ba2989 | 38.43 | 38.43 | 38.43 | 38.43 | 0.00 | 🟢 -18.37% |
| 10.1.0-alpha.10 | 47.23 | 47.23 | 47.23 | 47.23 | 0.00 | 🔴 +0.32% |

### npm - a11y+test+docs (with cache, without Playwright cache)

| Version | Mean (s) | Median (s) | Min (s) | Max (s) | StdDev (s) | vs Baseline |
|---------|---------|------------|---------|---------|------------|-------------|
| **10.0.7** (baseline) | 57.80 | 57.80 | 57.80 | 57.80 | 0.00 | - |
| 0.0.0-pr-32717-sha-47ba2989 | 50.04 | 50.04 | 50.04 | 50.04 | 0.00 | 🟢 -13.43% |
| 10.1.0-alpha.10 | 56.46 | 56.46 | 56.46 | 56.46 | 0.00 | 🟢 -2.32% |

### npm - a11y+test+docs (with cache, with Playwright cache)

| Version | Mean (s) | Median (s) | Min (s) | Max (s) | StdDev (s) | vs Baseline |
|---------|---------|------------|---------|---------|------------|-------------|
| **10.0.7** (baseline) | 27.79 | 27.79 | 27.79 | 27.79 | 0.00 | - |
| 0.0.0-pr-32717-sha-47ba2989 | 23.10 | 23.10 | 23.10 | 23.10 | 0.00 | 🟢 -16.88% |
| 10.1.0-alpha.10 | 30.92 | 30.92 | 30.92 | 30.92 | 0.00 | 🔴 +11.26% |

### yarn - a11y+docs (without cache)

| Version | Mean (s) | Median (s) | Min (s) | Max (s) | StdDev (s) | vs Baseline |
|---------|---------|------------|---------|---------|------------|-------------|
| **10.0.7** (baseline) | 25.47 | 25.47 | 25.27 | 25.68 | 0.20 | - |
| 10.1.0-alpha.10 | 25.84 | 25.84 | 24.33 | 27.35 | 1.51 | 🔴 +1.45% |

### yarn - a11y+docs (with cache)

| Version | Mean (s) | Median (s) | Min (s) | Max (s) | StdDev (s) | vs Baseline |
|---------|---------|------------|---------|---------|------------|-------------|
| **10.0.7** (baseline) | 15.37 | 15.37 | 12.62 | 18.12 | 2.75 | - |
| 10.1.0-alpha.10 | 16.34 | 16.34 | 11.92 | 20.76 | 4.42 | 🔴 +6.31% |

### yarn - a11y+test+docs (without cache, without Playwright cache)

| Version | Mean (s) | Median (s) | Min (s) | Max (s) | StdDev (s) | vs Baseline |
|---------|---------|------------|---------|---------|------------|-------------|
| **10.0.7** (baseline) | 66.42 | 66.42 | 63.38 | 69.47 | 3.05 | - |
| 10.1.0-alpha.10 | 63.68 | 63.68 | 63.20 | 64.16 | 0.48 | 🟢 -4.13% |

### yarn - a11y+test+docs (without cache, with Playwright cache)

| Version | Mean (s) | Median (s) | Min (s) | Max (s) | StdDev (s) | vs Baseline |
|---------|---------|------------|---------|---------|------------|-------------|
| **10.0.7** (baseline) | 51.06 | 51.06 | 49.73 | 52.39 | 1.33 | - |
| 10.1.0-alpha.10 | 51.16 | 51.16 | 49.96 | 52.35 | 1.20 | 🔴 +0.20% |

### yarn - a11y+test+docs (with cache, without Playwright cache)

| Version | Mean (s) | Median (s) | Min (s) | Max (s) | StdDev (s) | vs Baseline |
|---------|---------|------------|---------|---------|------------|-------------|
| **10.0.7** (baseline) | 44.87 | 44.87 | 43.58 | 46.15 | 1.28 | - |
| 10.1.0-alpha.10 | 48.71 | 48.71 | 43.88 | 53.54 | 4.83 | 🔴 +8.56% |

### yarn - a11y+test+docs (with cache, with Playwright cache)

| Version | Mean (s) | Median (s) | Min (s) | Max (s) | StdDev (s) | vs Baseline |
|---------|---------|------------|---------|---------|------------|-------------|
| **10.0.7** (baseline) | 29.28 | 29.28 | 28.37 | 30.18 | 0.90 | - |
| 10.1.0-alpha.10 | 28.46 | 28.46 | 28.41 | 28.52 | 0.05 | 🟢 -2.80% |

### yarn2 - a11y+docs (without cache)

| Version | Mean (s) | Median (s) | Min (s) | Max (s) | StdDev (s) | vs Baseline |
|---------|---------|------------|---------|---------|------------|-------------|
| **10.0.7** (baseline) | 16.10 | 16.10 | 15.56 | 16.64 | 0.54 | - |
| 0.0.0-pr-32717-sha-47ba2989 | 13.52 | 13.52 | 13.04 | 14.00 | 0.48 | 🟢 -16.02% |

### yarn2 - a11y+docs (with cache)

| Version | Mean (s) | Median (s) | Min (s) | Max (s) | StdDev (s) | vs Baseline |
|---------|---------|------------|---------|---------|------------|-------------|
| **10.0.7** (baseline) | 9.71 | 9.71 | 9.14 | 10.28 | 0.57 | - |
| 0.0.0-pr-32717-sha-47ba2989 | 7.52 | 7.52 | 7.49 | 7.55 | 0.03 | 🟢 -22.55% |

### yarn2 - a11y+test+docs (without cache, without Playwright cache)

| Version | Mean (s) | Median (s) | Min (s) | Max (s) | StdDev (s) | vs Baseline |
|---------|---------|------------|---------|---------|------------|-------------|
| **10.0.7** (baseline) | 49.34 | 49.34 | 48.78 | 49.91 | 0.56 | - |
| 0.0.0-pr-32717-sha-47ba2989 | 36.51 | 36.51 | 36.19 | 36.84 | 0.33 | 🟢 -26.00% |

### yarn2 - a11y+test+docs (without cache, with Playwright cache)

| Version | Mean (s) | Median (s) | Min (s) | Max (s) | StdDev (s) | vs Baseline |
|---------|---------|------------|---------|---------|------------|-------------|
| **10.0.7** (baseline) | 38.35 | 38.35 | 36.64 | 40.06 | 1.71 | - |
| 0.0.0-pr-32717-sha-47ba2989 | 24.97 | 24.97 | 24.09 | 25.85 | 0.88 | 🟢 -34.89% |

### yarn2 - a11y+test+docs (with cache, without Playwright cache)

| Version | Mean (s) | Median (s) | Min (s) | Max (s) | StdDev (s) | vs Baseline |
|---------|---------|------------|---------|---------|------------|-------------|
| **10.0.7** (baseline) | 34.71 | 34.71 | 34.25 | 35.17 | 0.46 | - |
| 0.0.0-pr-32717-sha-47ba2989 | 29.94 | 29.94 | 27.96 | 31.93 | 1.99 | 🟢 -13.74% |

### yarn2 - a11y+test+docs (with cache, with Playwright cache)

| Version | Mean (s) | Median (s) | Min (s) | Max (s) | StdDev (s) | vs Baseline |
|---------|---------|------------|---------|---------|------------|-------------|
| **10.0.7** (baseline) | 23.95 | 23.95 | 23.71 | 24.19 | 0.24 | - |
| 0.0.0-pr-32717-sha-47ba2989 | 14.61 | 14.61 | 14.42 | 14.80 | 0.19 | 🟢 -39.00% |

## Summary Statistics

### Overall Performance by Version

| Version | Avg Mean (s) | Avg Median (s) | Configurations | Tests |
|---------|--------------|----------------|---------------|-------|
| 0.0.0-pr-32717-sha-47ba2989 | 26.67 | 26.67 | 24 | 24 |
| 10.0.7 | 33.10 | 33.10 | 24 | 24 |
| 10.1.0-alpha.10 | 33.22 | 33.22 | 18 | 24 |

### Comparison vs Fastest Version (0.0.0-pr-32717-sha-47ba2989)

| Version | vs Fastest |
|---------|------------|
| 0.0.0-pr-32717-sha-47ba2989 | ⚪ +0.00% |
| 10.0.7 | 🔴 +24.10% |
| 10.1.0-alpha.10 | 🔴 +24.54% |
