# 𖤓 Ray Menu

https://github.com/user-attachments/assets/a6010441-fcfc-47ee-89ff-f5f37c2f8e4e

> **Infinite, fluid, and framework-agnostic radial menu for the modern web.**

**Ray Menu** is a lightweight, high-performance radial (pie) menu library designed with a "headless-first" philosophy. It combines advanced geometry with smooth 3D-inspired interactions, making it perfect for complex apps, games, or creative tools on the web.

## Key Features

- **⚛️ Framework Agnostic:** Built as a pure Web Component. Works in React, Vue, Svelte, or vanilla HTML.
- **🪶 Zero Dependencies:** Written in pure TypeScript with **0** runtime dependencies.
- **🌀 Infinite Radial Selection:** Select items based on angle, not distance. Flick your wrist to select.
- **🧠 Smart Edge Detection:** Context-aware positioning. The menu flips or shifts automatically when near screen edges.
- **⌨️ Full Keyboard Support:** Navigate with arrow keys, quick-select with 1-9, full accessibility.
- **⏳ Async Children:** Load submenu items on-demand from APIs with loading states and error handling.
- **🎨 Squishy Visuals:** Optional cursor trails and anchor lines for satisfying tactile feedback.

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

## 🎨 Theming via CSS Variables

All visual properties can be customized using CSS variables with the `--ray-*` prefix. These variables pierce the Shadow DOM, enabling external styling.

### Quick Start

```css
ray-menu {
  --ray-bg: #1a1a2e;
  --ray-text: #ffffff;
  --ray-accent: #ff6b6b;
  --ray-accent-text: white;
}
```

### Shadcn UI / Radix Integration

```css
ray-menu {
  --ray-bg: hsl(var(--popover));
  --ray-text: hsl(var(--popover-foreground));
  --ray-accent: hsl(var(--accent));
  --ray-accent-text: hsl(var(--accent-foreground));
  --ray-border: hsl(var(--border));
  --ray-radius: var(--radius);
}
```

### Available CSS Variables

| Variable               | Default                                | Description            |
| ---------------------- | -------------------------------------- | ---------------------- |
| `--ray-bg`             | `rgba(30, 30, 40, 0.95)`               | Label background       |
| `--ray-text`           | `#e4e4e7`                              | Label text color       |
| `--ray-border`         | `rgba(255, 255, 255, 0.15)`            | Label border           |
| `--ray-accent`         | `rgba(100, 180, 255, 0.95)`            | Hover/focus background |
| `--ray-accent-text`    | `white`                                | Hover/focus text       |
| `--ray-accent-glow`    | `rgba(100, 180, 255, 0.4)`             | Glow effect            |
| `--ray-muted`          | `rgba(255, 255, 255, 0.6)`             | Muted text/icons       |
| `--ray-radius`         | `8px`                                  | Border radius          |
| `--ray-shadow`         | `0 4px 12px rgba(0,0,0,0.3)`           | Box shadow             |
| `--ray-font-family`    | `system-ui, -apple-system, sans-serif` | Font family            |
| `--ray-font-size`      | `14px`                                 | Font size              |
| `--ray-arc-fill`       | `rgba(50, 50, 60, 0.6)`                | Arc segment fill       |
| `--ray-arc-fill-hover` | `rgba(100, 180, 255, 0.4)`             | Arc hover fill         |
| `--ray-arc-stroke`     | `rgba(255, 255, 255, 0.1)`             | Arc stroke             |
| `--ray-center-fill`    | `rgba(0, 0, 0, 0.85)`                  | Center circle fill     |
| `--ray-error`          | `#f87171`                              | Error state color      |

## 🌀 Fan Layouts & Dock Mode

Ray Menu supports partial arcs (fan layouts) and static positioning for navigation docks.

### Fan Layouts

Use `start-angle` and `sweep-angle` to create half-circles, quarter-arcs, or any custom sector:

```html
<!-- Half-circle (Fan Up) - Great for bottom navigation -->
<ray-menu start-angle="180" sweep-angle="180"></ray-menu>

<!-- Quarter arc (Top-Right corner) -->
<ray-menu start-angle="-90" sweep-angle="90"></ray-menu>

<!-- Side fan (Fan Right) - For sidebar menus -->
<ray-menu start-angle="-90" sweep-angle="180"></ray-menu>
```

| Layout          | Start Angle | Sweep Angle | Use Case               |
| --------------- | ----------- | ----------- | ---------------------- |
| **Full Circle** | `-90`       | `360`       | Classic radial menu    |
| **Fan Up**      | `180`       | `180`       | Bottom navigation dock |
| **Fan Down**    | `0`         | `180`       | Top toolbar            |
| **Fan Right**   | `-90`       | `180`       | Left sidebar           |
| **Fan Left**    | `90`        | `180`       | Right sidebar          |

### Dock Mode

Create permanent navigation elements with `static` and `default-open`:

```html
<footer
  style="position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);"
>
  <ray-menu
    static
    default-open
    start-angle="180"
    sweep-angle="180"
    radius="100"
  >
  </ray-menu>
</footer>
```

- **`static`**: Uses relative positioning (inline layout instead of fixed overlay)
- **`default-open`**: Opens automatically and stays open (resets selection instead of closing)

## ⚙️ Configuration

**Web Component Attributes**

| Attribute / Prop     | Type      | Default   | Description                                      |
| -------------------- | --------- | --------- | ------------------------------------------------ |
| `radius`             | `number`  | `120`     | Outer radius in pixels.                          |
| `inner-radius`       | `number`  | `40`      | Inner "dead zone" for the center.                |
| `gap`                | `number`  | `0.05`    | Gap between items in radians.                    |
| `start-angle`        | `number`  | `-90`     | Start angle in degrees (0=right, -90=top)        |
| `sweep-angle`        | `number`  | `360`     | Arc span in degrees (360=full, 180=half)         |
| `static`             | `boolean` | `false`   | Dock mode: relative positioning, inline layout   |
| `default-open`       | `boolean` | `false`   | Auto-open on mount, stays open (for docks)       |
| `animation-duration` | `number`  | `200`     | Animation ms (default: 200)                      |
| `edge-detection`     | `boolean` | `true`    | Enable edge repositioning (default: true)        |
| `smart-flip`         | `boolean` | `true`    | Enable flip behavior (default: true)             |
| `edge-behavior`      | `string`  | `'flip'`  | Edge handling mode: `flip`, `shift`, or `none`.  |
| `infinite-selection` | `boolean` | `true`    | Selection extends beyond the menu radius.        |
| `center-deadzone`    | `number`  | `30`      | No selection within this radius                  |
| `infinite-threshold` | `number`  | `0`       | Max selection distance (0 = infinite)            |
| `show-trail-path`    | `boolean` | `false`   | Enables the "Drift Trace" cursor trail.          |
| `show-anchor-line`   | `boolean` | `false`   | Show line from menu edge to cursor.              |
| `scroll-behavior`    | `string`  | `'close'` | Scroll handling: `close`, `keep`, `lock`, `none` |
| `scroll-threshold`   | `number`  | `10`      | Scroll distance (px) before close (close mode)   |

**Web Component Methods**

- `open(x: number, y: number)` - Open menu at position
- `close()` - Close menu
- `toggle(x: number, y: number)` - Toggle menu at position
- `goBack()` - Navigate back to parent menu (returns `false` if at root)
- `goToRoot()` - Navigate back to root menu

**Submenu Navigation**

- `submenuDepth` - Get current submenu depth (0 = root)

**Drag & Drop API** (imperative, works with any drag library)

- `openAsDropTarget(x, y)` - Open menu as a drop target
- `updateHoverFromPoint(x, y)` - Update selection from drag coordinates
- `dropOnHovered(data?)` - Trigger drop on current selection, returns selected item
- `cancelDrop()` - Cancel drop mode
- `getHoveredItem()` - Get currently hovered item (for preview)

**Web Component Properties (read-only)**

- `isOpen` - Whether menu is open
- `isLoading` - Whether async children are loading
- `isDropTarget` - Whether menu is in drop target mode
- `submenuDepth` - Current submenu depth (0 = root)

**Web Component Events**

- `ray-select` - Fired when an item is selected
- `ray-drop` - Fired on drop. `e.detail` contains `{ item, data }`
- `ray-submenu-enter` - Fired when entering a submenu. `e.detail` contains `{ item, depth }`
- `ray-submenu-exit` - Fired when exiting a submenu. `e.detail` contains `{ item, depth }`
- `ray-load-start` - Fired when async loading starts. `e.detail` is the item
- `ray-load-complete` - Fired when async loading completes. `e.detail` is the item
- `ray-load-error` - Fired on load error. `e.detail` contains `{ item, error }`
- `ray-open` - Fired when menu opens
- `ray-close` - Fired when menu closes

## 🎯 Drag & Drop Integration

RayMenu can act as a drop target for any drag library (HTML5, dnd-kit, react-dnd, etc.):

```js
const menu = document.querySelector("ray-menu");

dropZone.addEventListener("dragenter", (e) => {
  // Open menu as drop target
  menu.openAsDropTarget(e.clientX, e.clientY);
});

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  // Update hover from drag position
  menu.updateHoverFromPoint(e.clientX, e.clientY);
});

dropZone.addEventListener("drop", (e) => {
  // Trigger selection with drag data
  const item = menu.dropOnHovered({
    action: "move",
    files: e.dataTransfer.files,
  });
});

menu.addEventListener("ray-drop", (e) => {
  console.log("Dropped on:", e.detail.item, "Data:", e.detail.data);
});
```

**Spring-loading**: Hovering over an item with children for 500ms automatically enters the submenu.

## 🔄 Submenu Navigation

RayMenu supports nested submenus with gesture-based navigation optimized for fast, drag-heavy workflows:

**Click Navigation:**

- Click items with `▸` indicator to enter submenus
- Click the center area to go back to parent menu

**Keyboard:** `↓`/`Enter` to enter, `↑`/`Backspace` to go back (see Keyboard Navigation)

**Drag-Through Gestures** (during drag operations):

- **Swipe outward fast** over a submenu item → instantly enters submenu (no wait)
- **Swipe inward fast** → goes back to parent menu
- Parent levels are shown as dimmed concentric rings

**Menu Item Options:**

```js
{
  id: "share",
  label: "Share",
  selectable: false,  // Only opens submenu, not directly selectable
  children: [
    { id: "email", label: "Email" },
    { id: "link", label: "Copy Link" },
  ]
}
```

## ⌨️ Keyboard Navigation

Full keyboard support for accessibility and power users:

| Key                 | Action                      |
| ------------------- | --------------------------- |
| `←` `→`             | Navigate between items      |
| `↓` `Enter` `Space` | Select item / enter submenu |
| `↑` `Backspace`     | Go back (or close at root)  |
| `Escape`            | Close menu                  |
| `Home` `End`        | Jump to first/last item     |
| `1`-`9`             | Quick select by number      |

Number hints appear on items when keyboard mode is active.

## ⏳ Async Children Loading

Load submenu items dynamically from APIs:

```js
menu.items = [
  {
    id: "folders",
    label: "Move to",
    selectable: false,
    loadChildren: async () => {
      const res = await fetch("/api/folders");
      return res.json();
    },
  },
];
```

**Features:**

- Loading spinner shown during fetch
- Error state with auto-dismiss
- Results cached after first load
- Supports nested async at any depth

**Events:**

- `ray-load-start` - Loading begins
- `ray-load-complete` - Loading succeeded
- `ray-load-error` - Loading failed (`e.detail.error`)

## 📜 Scroll Behavior

Control how the menu behaves when the page scrolls:

| Mode    | Description                                                        |
| ------- | ------------------------------------------------------------------ |
| `close` | **(default)** Close menu when scroll exceeds threshold             |
| `keep`  | Menu stays fixed to its document position (scrolls with page)      |
| `lock`  | Prevent scrolling while menu is open (with scrollbar compensation) |
| `none`  | Do nothing, menu stays at viewport position                        |

```html
<!-- Close on scroll (default) -->
<ray-menu scroll-behavior="close" scroll-threshold="10"></ray-menu>

<!-- Lock scroll while open -->
<ray-menu scroll-behavior="lock"></ray-menu>

<!-- Keep at document position -->
<ray-menu scroll-behavior="keep"></ray-menu>
```

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
