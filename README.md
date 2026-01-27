# 𖤓 Ray Menu

> **Infinite, fluid, and framework-agnostic radial menu for the modern web.**

**Ray Menu** is a lightweight, high-performance radial (pie) menu library designed with a "headless-first" philosophy. It combines advanced geometry with smooth 3D-inspired interactions, making it perfect for complex apps, games, or creative tools on the web.

## Key Features

- **⚛️ Framework Agnostic:** Built as a pure Web Component. Works in React, Vue, Svelte, or vanilla HTML.
- **🪶 Zero Dependencies:** Written in pure TypeScript with **0** runtime dependencies. Only **19KB**.
- **🌀 Infinite Radial Selection:** Select items based on angle, not distance. Flick your wrist to select.
- **🧠 Smart Edge Detection:** Context-aware positioning. The menu flips or shifts automatically when near screen edges.
- **🎨 Squishy Visuals:** Optiona cursor trails and anchor lines for satisfying tactile feedback.

## 🚀 Installation

```bash
# Use your package manager npm, yarn, pnpm, or bun
bun add ray-menu
```

Using CDN:

```html
<script type="module">
  import "https://unpkg.com/ray-menu@latest/dist/wc/ray-menu.mjs";
</script>
```

## 🛠 Usage

### 1. Web Component (Universal)

Perfect for any project. Just import and use the custom tag.

```html
<script type="module">
  import "ray-menu";
  const menu = document.querySelector("ray-menu");

  menu.items = [
    { id: "copy", label: "Copy", shortcut: "⌘C" },
    { id: "paste", label: "Paste", shortcut: "⌘V" },
  ];

  menu.addEventListener("ray-select", (e) => console.log(e.detail.item));
</script>

<ray-menu id="menu" radius="140" show-anchor-line></ray-menu>
```

### 2. React Bindings

Includes a specialized hook and the `TheHelm` component for a seamless React experience.

```tsx
import { TheHelm, useRadialMenu } from "ray-menu/react";

function App() {
  const menu = useRadialMenu({
    items: [{ id: "1", label: "Save" }],
    onSelect: (item) => console.log(item),
  });

  return (
    <div onContextMenu={menu.open}>
      <TheHelm menu={menu} showTrailPath />
    </div>
  );
}
```

<details>
<summary>Core Logic Only</summary>

Use the pure TypeScript core without any UI:

```ts
import {
  angleFromCenter,
  distance,
  distributeAngles,
  detectEdgeConstraints,
  calculateSmartFlip,
} from "ray-menu/core";

// Calculate angles for 6 menu items
const angles = distributeAngles(6);

// Detect edge constraints
const viewport = { width: window.innerWidth, height: window.innerHeight };
const edgeState = detectEdgeConstraints({ x: 100, y: 50 }, 120, viewport);

// Calculate flip state
const flipState = calculateSmartFlip({ x: 100, y: 50 }, 120, edgeState);
```

</details>

## 📐 Technical Architecture

RayMenu is split into three distinct layers to provide maximum flexibility:

| Layer     | Path             | Description                                                     |
| --------- | ---------------- | --------------------------------------------------------------- |
| **Core**  | `ray-menu/core`  | Pure math: `atan2` calculations, edge logic, and physics.       |
| **WC**    | `ray-menu`       | The `<ray-menu>` Web Component. Zero-dep & Shadow DOM isolated. |
| **React** | `ray-menu/react` | Typed hooks and components for the React ecosystem.             |

## ⚙️ Configuration

**Web Component Attributes**

| Attribute / Prop     | Type      | Default  | Description                                     |
| -------------------- | --------- | -------- | ----------------------------------------------- |
| `radius`             | `number`  | `120`    | Outer radius in pixels.                         |
| `inner-radius`       | `number`  | `40`     | Inner "dead zone" for the center.               |
| `gap`                | `number`  | `0.05`   | Gap between items in radians.                   |
| `start-angle`        | `number`  | `-π/2`   | Start angle (default: -π/2, top)                |
| `sweep-angle`        | `number`  | `2π`     | Total arc span (default: 2π, full circle)       |
| `animation-duration` | `number`  | `200`    | Animation ms (default: 200)                     |
| `edge-detection`     | `boolean` | `true`   | Enable edge repositioning (default: true)       |
| `smart-flip`         | `boolean` | `true`   | Enable flip behavior (default: true)            |
| `edge-behavior`      | `string`  | `'flip'` | Edge handling mode: `flip`, `shift`, or `none`. |
| `infinite-selection` | `boolean` | `true`   | Selection extends beyond the menu radius.       |
| `center-deadzone`    | `number`  | `30`     | No selection within this radius                 |
| `infinite-threshold` | `number`  | `0`      | Max selection distance (0 = infinite)           |
| `show-trail-path`    | `boolean` | `false`  | Enables the "Drift Trace" cursor trail.         |
| `show-anchor-line`   | `boolean` | `false`  | Show line from menu edge to cursor.             |

**Web Component Methods**

- `open(x: number, y: number)` - Open menu at position
- `close()` - Close menu
- `toggle(x: number, y: number)` - Toggle menu at position

**Web Component Events**

- `ray-select` - Fired when an item is selected. `e.detail.item` contains the selected item.
- `ray-open` - Fired when menu opens
- `ray-close` - Fired when menu closes

## ✺ Infinite Selection Logic

Unlike standard menus that require precise hovering, **RayMenu** uses angular sectors. Once the menu is open, the cursor's distance doesn't matter—only its angle relative to the center. This turns every selection into a fast, "flick-style" gesture, significantly reducing cognitive load and increasing speed.

## 🧪 Development

```bash
# Install
bun install

# Dev Playground
bun run dev

# Build (Generates dist/wc and dist/react)
bun run build
```

<details>
<summary>Testing</summary>

```bash
# Install Playwright
bunx playwright install

# Run E2E tests
bun run test:e2e
```

</details>

## License

MIT
