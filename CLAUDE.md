# CLAUDE.md

## Project Overview

React library for radial/pie menus using Vite's library mode. Headless-first architecture with core logic separated from React components.

## Key Commands

```bash
bun run dev       # Start playground dev server
bun run build     # Build library to dist/
bun run typecheck # Run TypeScript checks
```

## Architecture

- `/src/core/` - Pure TypeScript logic (angle math, edge detection, flip logic, physics). No React dependencies.
- `/src/components/` - React components (TheHelm, ArcSubMenu, DriftTrace). Use inline styles for portability.
- `/src/hooks/` - useRadialMenu hook for state management.
- `/playground/` - Dev-only React app for testing.

## Code Style

- Components use inline styles (not Tailwind classes) for framework-agnostic output
- Core logic must remain pure TypeScript with no React imports
- Path aliases: `@core`, `@components`, `@hooks`

## Key Features

- **Infinite Radial Selection**: Sectors extend infinitely outward. Selection based on angular sector, not distance.
- **Radial Config API**: Customizable `centerDeadzone`, `infiniteThreshold`, `edgeBehavior` (shift/flip/none).
- **Drift Trace**: Visual trail anchored to selected path, stretches toward cursor position.

## Build Output

Library builds to ESM + CJS with TypeScript definitions. React/ReactDOM are externalized (peer dependencies).
