# CLAUDE.md

## Project Overview

Ray Menu - A framework-agnostic radial/pie menu library. Web Component as primary output, with React bindings. Headless-first architecture with core logic separated from UI.

## Key Commands

```bash
bun run dev         # Start React playground dev server
bun run build       # Build both Web Component and React to dist/
bun run build:wc    # Build Web Component only
bun run build:react # Build React only
bun run typecheck   # Run TypeScript checks
```

## Architecture

- `/src/core/` - Pure TypeScript logic (angle math, edge detection, flip logic, physics). No framework dependencies.
- `/src/wc/` - Web Component (`<ray-menu>`). Zero dependencies, uses Shadow DOM.
- `/src/components/` - React components (TheHelm, ArcSubMenu, DriftTrace). Use inline styles.
- `/src/hooks/` - useRadialMenu hook for React state management.
- `/playground/` - Dev-only testing apps (React + HTML for WC).

## Code Style

- Components use inline styles (not Tailwind classes) for framework-agnostic output
- Core logic must remain pure TypeScript with no framework imports
- Web Component uses Shadow DOM with scoped styles
- Path aliases: `@core`, `@components`, `@hooks`

## Key Features

- **Infinite Radial Selection**: Sectors extend infinitely outward. Selection based on angular sector, not distance.
- **Radial Config API**: Customizable `centerDeadzone`, `infiniteThreshold`, `edgeBehavior` (shift/flip/none).
- **Drift Trace**: Visual trail anchored to selected path, stretches toward cursor position.

## Build Output

- `dist/wc/` - Web Component (ESM + CJS), zero dependencies
- `dist/react/` - React bindings (ESM + CJS), React as peer dep
