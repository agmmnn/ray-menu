# ray-menu

https://github.com/user-attachments/assets/c4fdf273-ccb6-4610-8bca-c24640e3f010

Radial menu for the web. Framework-agnostic. Zero dependencies.

- **Web Component** — Works with any framework or vanilla HTML
- **React bindings** — `useRayMenu` hook with full TypeScript support
- **Infinite selection** — Select by angle, not distance
- **Submenus** — Nested menus with async loading support
- **Keyboard nav** — Arrow keys, number keys, escape
- **Drag & drop** — Use as a drop target with any drag library
- **Theming** — CSS variables with `--ray-*` prefix
- **Edge detection** — Auto-flip near screen edges

## Install

```bash
npm i ray-menu
```

## Usage

### Web Component

```html
<script type="module">
  import "ray-menu";

  const menu = document.querySelector("ray-menu");

  menu.items = [
    { id: "copy", label: "Copy" },
    { id: "paste", label: "Paste" },
    { id: "delete", label: "Delete" },
  ];

  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    menu.open(e.clientX, e.clientY);
  });

  menu.addEventListener("ray-select", (e) => {
    console.log("Selected:", e.detail);
  });
</script>

<ray-menu></ray-menu>
```

### React

```tsx
import { useRayMenu } from "ray-menu/react";

function App() {
  const menu = useRayMenu({
    items: [
      { id: "copy", label: "Copy" },
      { id: "paste", label: "Paste" },
    ],
    onSelect: (item) => console.log(item),
  });

  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault();
        menu.open(e.clientX, e.clientY);
      }}
    >
      Right-click me
    </div>
  );
}
```

## Theming

```css
ray-menu {
  --ray-bg: #1a1a2e;
  --ray-text: #ffffff;
  --ray-accent: #ff6b6b;
}
```

## API

### Attributes

| Attribute          | Default | Description                  |
| ------------------ | ------- | ---------------------------- |
| `radius`           | `120`   | Menu radius in pixels        |
| `inner-radius`     | `40`    | Center dead zone             |
| `show-trail-path`  | `false` | Cursor trail effect          |
| `show-anchor-line` | `false` | Line from menu to cursor     |
| `start-angle`      | `-90`   | Start angle in degrees       |
| `sweep-angle`      | `360`   | Arc span (180 = half circle) |

### Methods

- `open(x, y)` — Open at position
- `close()` — Close menu
- `toggle(x, y)` — Toggle at position

### Events

- `ray-select` — Item selected
- `ray-open` — Menu opened
- `ray-close` — Menu closed

## Packages

| Import           | Description         |
| ---------------- | ------------------- |
| `ray-menu`       | Web Component       |
| `ray-menu/react` | React bindings      |
| `ray-menu/core`  | Pure math utilities |

## Docs

Full documentation at [ray-menu.vercel.app/docs](https://ray-menu.vercel.app/docs)

## License

MIT
