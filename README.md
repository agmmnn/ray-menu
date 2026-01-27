# Ray Menu

A framework-agnostic radial/pie menu library with Web Component and React bindings. Features smart edge detection, flip behavior, and infinite radial selection.

## Features

- **Framework-agnostic** - Web Component works anywhere, React bindings available
- **Zero dependencies** - Pure TypeScript, no runtime dependencies
- **Headless-first architecture** - Core logic separated from UI
- **Smart edge detection** - Automatic repositioning near viewport edges
- **Flip behavior** - Intelligent flip when near edges
- **Infinite radial selection** - Select based on angle, not distance
- **Visual effects** - Optional cursor trail and anchor line effects
- **Submenu support**
- **Keyboard navigation** (Escape to close)
- **TypeScript support** with full type definitions

## Installation

```bash
npm install ray-menu
# or
bun add ray-menu
```

## Usage

### Web Component (Framework-agnostic)

```html
<ray-menu id="menu" radius="140" inner-radius="45" infinite-selection></ray-menu>

<script type="module">
  import 'ray-menu';

  const menu = document.getElementById('menu');

  // Set menu items
  menu.items = [
    { id: 'copy', label: 'Copy', shortcut: 'Cmd+C' },
    { id: 'paste', label: 'Paste', shortcut: 'Cmd+V' },
    { id: 'cut', label: 'Cut', shortcut: 'Cmd+X' },
  ];

  // Listen for selection
  menu.addEventListener('ray-select', (e) => {
    console.log('Selected:', e.detail.item);
  });

  // Open on right-click
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    menu.open(e.clientX, e.clientY);
  });
</script>
```

#### Web Component Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `radius` | number | 120 | Outer radius in pixels |
| `inner-radius` | number | 40 | Inner dead zone radius |
| `infinite-selection` | boolean | true | Enable infinite radial selection |
| `center-deadzone` | number | 30 | No selection within this radius |
| `infinite-threshold` | number | 0 | Max selection distance (0 = infinite) |
| `edge-behavior` | 'flip' \| 'shift' \| 'none' | 'flip' | Edge handling mode |
| `show-trail-path` | boolean | false | Show cursor trail effect |
| `show-anchor-line` | boolean | false | Show line from menu edge to cursor |

#### Web Component Methods

- `open(x: number, y: number)` - Open menu at position
- `close()` - Close menu
- `toggle(x: number, y: number)` - Toggle menu at position

#### Web Component Events

- `ray-select` - Fired when an item is selected. `e.detail.item` contains the selected item.
- `ray-open` - Fired when menu opens
- `ray-close` - Fired when menu closes

### React

```tsx
import { TheHelm, useRadialMenu, type MenuItem } from 'ray-menu/react';

const menuItems: MenuItem[] = [
  { id: 'copy', label: 'Copy', shortcut: 'Cmd+C', onSelect: () => console.log('Copy') },
  { id: 'paste', label: 'Paste', shortcut: 'Cmd+V', onSelect: () => console.log('Paste') },
  { id: 'cut', label: 'Cut', shortcut: 'Cmd+X', onSelect: () => console.log('Cut') },
];

function App() {
  const menu = useRadialMenu({
    items: menuItems,
    onSelect: (item) => console.log('Selected:', item.label),
    config: {
      radius: 140,
      innerRadius: 45,
      infiniteSelection: true,
      centerDeadzone: 30,
    },
  });

  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault();
        menu.open({ x: e.clientX, y: e.clientY });
      }}
    >
      Right-click to open menu
      <TheHelm menu={menu} showTrailPath showAnchorLine />
    </div>
  );
}
```

### Core Logic Only

Use the pure TypeScript core without any UI:

```ts
import {
  angleFromCenter,
  distance,
  distributeAngles,
  detectEdgeConstraints,
  calculateSmartFlip,
} from 'ray-menu/core';

// Calculate angles for 6 menu items
const angles = distributeAngles(6);

// Detect edge constraints
const viewport = { width: window.innerWidth, height: window.innerHeight };
const edgeState = detectEdgeConstraints({ x: 100, y: 50 }, 120, viewport);

// Calculate flip state
const flipState = calculateSmartFlip({ x: 100, y: 50 }, 120, edgeState);
```

## Configuration Options

```ts
interface MenuConfig {
  radius: number;            // Outer radius (default: 120)
  innerRadius: number;       // Inner dead zone (default: 40)
  gap: number;               // Gap between items in radians (default: 0.05)
  startAngle: number;        // Start angle (default: -PI/2, top)
  sweepAngle: number;        // Total arc span (default: 2*PI, full circle)
  animationDuration: number; // Animation ms (default: 200)
  edgeDetection: boolean;    // Enable edge repositioning (default: true)
  smartFlip: boolean;        // Enable flip behavior (default: true)

  // Infinite Selection Mode
  infiniteSelection: boolean;   // Sectors extend infinitely (default: true)
  centerDeadzone: number;       // No selection within this radius (default: 30)
  infiniteThreshold: number;    // Max distance, 0 = truly infinite (default: 0)
  edgeBehavior: 'flip' | 'shift' | 'none'; // Edge handling (default: 'flip')
}
```

## Visual Effects

The menu supports optional visual effects for cursor tracking:

- **Trail Path** - Shows a fading trail following cursor movement with direction indicator
- **Anchor Line** - Shows a dashed line from the selected menu item edge to the cursor when outside the menu radius

### Web Component
```html
<ray-menu show-trail-path show-anchor-line></ray-menu>
```

### React
```tsx
<TheHelm menu={menu} showTrailPath showAnchorLine />
```

## Infinite Radial Selection

When `infiniteSelection` is enabled, menu items are selected based on the angular sector alone, regardless of cursor distance. This allows users to:

- Move the cursor far beyond the menu while maintaining selection
- Make quick selections with broad gestures
- Reduce precision requirements for item selection

The `centerDeadzone` prevents erratic selection when the cursor is too close to the center.

## Project Structure

```
src/
├── core/           # Pure TypeScript logic (no framework deps)
│   ├── angle.ts    # atan2-based angle calculations
│   ├── edge.ts     # Viewport edge detection
│   ├── flip.ts     # Smart flip logic
│   ├── physics.ts  # Animation utilities
│   └── types.ts    # Type definitions
├── wc/             # Web Component
│   ├── ray-menu.ts # Custom element
│   └── index.ts    # Entry point
├── components/     # React components
│   ├── TheHelm.tsx
│   ├── ArcSubMenu.tsx
│   └── DriftTrace.tsx
├── hooks/
│   └── useRadialMenu.ts
└── index.ts        # React entry point
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

### Build the library

```bash
bun run build
```

Output:
- `dist/wc/` - Web Component build (framework-agnostic)
- `dist/react/` - React build

### Type check

```bash
bun run typecheck
```

## License

MIT
