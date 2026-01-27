# Radial Menu

A headless-first React component library for radial/pie menus with smart edge detection and flip behavior.

## Features

- Headless-first architecture - core logic is framework-agnostic
- Smart edge detection and automatic repositioning
- Flip behavior when near viewport edges
- Submenu support
- Keyboard navigation (Escape to close)
- TypeScript support with full type definitions

## Project Structure

```
src/
├── core/           # Pure TypeScript logic (no React)
│   ├── angle.ts    # atan2-based angle calculations
│   ├── edge.ts     # Viewport edge detection
│   ├── flip.ts     # Smart flip logic
│   ├── physics.ts  # Animation utilities
│   └── types.ts    # Type definitions
├── components/     # React components
│   ├── TheHelm.tsx     # Main menu component
│   ├── ArcSubMenu.tsx  # Arc segment renderer
│   └── DriftTrace.tsx  # Pointer trail effect
├── hooks/          # React hooks
│   └── useRadialMenu.ts
└── index.ts        # Library entry point
```

## Development

### Prerequisites

- Node.js 18+
- Bun (recommended) or npm

### Install dependencies

```bash
bun install
```

### Run the playground

```bash
bun run dev
```

This starts a development server at `http://localhost:3000` with a demo page.

### Build the library

```bash
bun run build
```

Output files are generated in `dist/`:
- `radial-menu.mjs` - ES module
- `radial-menu.cjs` - CommonJS module
- `radial-menu.css` - Styles
- `index.d.ts` - TypeScript definitions

### Type check

```bash
bun run typecheck
```

## Usage

### Installation

```bash
npm install radial-menu
# or
bun add radial-menu
```

### Basic Usage

```tsx
import { TheHelm, useRadialMenu, type MenuItem } from 'radial-menu'

const menuItems: MenuItem[] = [
  { id: 'copy', label: 'Copy', shortcut: '⌘C', onSelect: () => console.log('Copy') },
  { id: 'paste', label: 'Paste', shortcut: '⌘V', onSelect: () => console.log('Paste') },
  { id: 'cut', label: 'Cut', shortcut: '⌘X', onSelect: () => console.log('Cut') },
  {
    id: 'share',
    label: 'Share',
    children: [
      { id: 'email', label: 'Email', onSelect: () => console.log('Email') },
      { id: 'link', label: 'Copy Link', onSelect: () => console.log('Link') },
    ]
  },
]

function App() {
  const menu = useRadialMenu({
    items: menuItems,
    onSelect: (item) => console.log('Selected:', item.label),
    config: {
      radius: 140,
      innerRadius: 45,
    },
  })

  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault()
        menu.open({ x: e.clientX, y: e.clientY })
      }}
    >
      Right-click to open menu
      <TheHelm menu={menu} />
    </div>
  )
}
```

### Headless Usage (Core Only)

Use the core logic without React components:

```ts
import {
  angleFromCenter,
  distance,
  distributeAngles,
  detectEdgeConstraints,
  calculateSmartFlip
} from 'radial-menu'

// Calculate angles for 6 menu items
const angles = distributeAngles(6)

// Detect edge constraints
const viewport = { width: window.innerWidth, height: window.innerHeight }
const edgeState = detectEdgeConstraints({ x: 100, y: 50 }, 120, viewport)

// Calculate flip state
const flipState = calculateSmartFlip({ x: 100, y: 50 }, 120, edgeState)
```

### Configuration Options

```ts
interface MenuConfig {
  radius: number          // Outer radius (default: 120)
  innerRadius: number     // Inner dead zone (default: 40)
  gap: number             // Gap between items in radians (default: 0.05)
  startAngle: number      // Start angle (default: -π/2, top)
  sweepAngle: number      // Total arc span (default: 2π, full circle)
  animationDuration: number  // Animation ms (default: 200)
  edgeDetection: boolean  // Enable edge repositioning (default: true)
  smartFlip: boolean      // Enable flip behavior (default: true)

  // Infinite Selection Mode
  infiniteSelection: boolean  // Sectors extend infinitely outward (default: true)
  centerDeadzone: number      // No selection within this radius (default: 30)
  infiniteThreshold: number   // Max distance, 0 = truly infinite (default: 0)
  edgeBehavior: 'flip' | 'shift' | 'none'  // Edge handling mode (default: 'flip')
}
```

### Infinite Radial Selection

When `infiniteSelection` is enabled, menu items are selected based on the angular sector alone, regardless of cursor distance from the menu center. This allows users to:

- Move the cursor far beyond the menu while maintaining selection
- Make quick selections with broad gestures
- Reduce precision requirements for item selection

The `centerDeadzone` prevents erratic selection when the cursor is too close to the center.

### MenuItem Interface

```ts
interface MenuItem {
  id: string
  label: string
  icon?: React.ReactNode
  shortcut?: string
  disabled?: boolean
  children?: MenuItem[]  // For submenus
  onSelect?: () => void
}
```

## License

MIT
