import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";

export const Route = createFileRoute("/playground")({
  component: Playground,
  head: () => ({
    meta: [{ title: "Playground - ray-menu" }],
  }),
  ssr: false, // Disable SSR for this page - Web Components need client-side only
});

const defaultItems = [
  { id: "copy", label: "Copy", shortcut: "\u2318+C" },
  { id: "paste", label: "Paste", shortcut: "\u2318+V" },
  { id: "cut", label: "Cut", shortcut: "\u2318+X" },
  { id: "delete", label: "Delete", shortcut: "\u2326" },
  {
    id: "share",
    label: "Share",
    selectable: false,
    children: [
      { id: "share-email", label: "Email" },
      { id: "share-link", label: "Copy Link" },
      {
        id: "share-social",
        label: "Social",
        selectable: false,
        children: [
          { id: "share-twitter", label: "Twitter" },
          { id: "share-facebook", label: "Facebook" },
          { id: "share-linkedin", label: "LinkedIn" },
        ],
      },
    ],
  },
  {
    id: "move",
    label: "Move to",
    selectable: false,
    loadChildren: async () => {
      await new Promise((r) => setTimeout(r, 800));
      return [
        { id: "move-docs", label: "Documents" },
        { id: "move-photos", label: "Photos" },
        { id: "move-downloads", label: "Downloads" },
      ];
    },
  },
];

const fanPresets: Record<string, { start: number; sweep: number }> = {
  full: { start: -90, sweep: 360 },
  "fan-up": { start: 180, sweep: 180 },
  "fan-down": { start: 0, sweep: 180 },
  "fan-right": { start: -90, sweep: 180 },
  "fan-left": { start: 90, sweep: 180 },
  quarter: { start: -90, sweep: 90 },
};

function Playground() {
  const menuRef = useRef<any>(null);
  const [log, setLog] = useState("Right-click or click in the demo area");
  const [config, setConfig] = useState({
    infinite: true,
    trailPath: false,
    anchorLine: false,
    centerTransparent: true,
    edgeBehavior: "flip",
    startAngle: -90,
    sweepAngle: 360,
    deadzone: 30,
  });

  const [ready, setReady] = useState(false);
  const [dragData, setDragData] = useState<{
    type: string;
    label: string;
  } | null>(null);

  useEffect(() => {
    import("ray-menu").then(() => {
      // Wait for custom element to be defined
      customElements.whenDefined("ray-menu").then(() => {
        setReady(true);
      });
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    const menu = menuRef.current;
    if (!menu) return;

    menu.items = defaultItems;

    const onSelect = (e: CustomEvent) => {
      setLog(`Selected: ${e.detail.label}`);
    };
    const onOpen = () => setLog("Menu opened");
    const onSubmenuEnter = (e: CustomEvent) =>
      setLog(
        `Entered submenu: ${e.detail.item.label} (depth: ${e.detail.depth})`,
      );
    const onSubmenuExit = (e: CustomEvent) =>
      setLog(
        `Exited submenu: ${e.detail.item.label} (depth: ${e.detail.depth})`,
      );
    const onLoadError = (e: CustomEvent) =>
      setLog(`Error: ${e.detail.error.message}`);

    menu.addEventListener("ray-select", onSelect);
    menu.addEventListener("ray-open", onOpen);
    menu.addEventListener("ray-submenu-enter", onSubmenuEnter);
    menu.addEventListener("ray-submenu-exit", onSubmenuExit);
    menu.addEventListener("ray-load-error", onLoadError);

    return () => {
      menu.removeEventListener("ray-select", onSelect);
      menu.removeEventListener("ray-open", onOpen);
      menu.removeEventListener("ray-submenu-enter", onSubmenuEnter);
      menu.removeEventListener("ray-submenu-exit", onSubmenuExit);
      menu.removeEventListener("ray-load-error", onLoadError);
    };
  }, [ready]);

  // Sync config to menu attributes
  useEffect(() => {
    if (!ready) return;
    const menu = menuRef.current;
    if (!menu) return;

    if (config.infinite) menu.setAttribute("infinite-selection", "");
    else menu.removeAttribute("infinite-selection");

    if (config.trailPath) menu.setAttribute("show-trail-path", "");
    else menu.removeAttribute("show-trail-path");

    if (config.anchorLine) menu.setAttribute("show-anchor-line", "");
    else menu.removeAttribute("show-anchor-line");

    if (!config.centerTransparent)
      menu.setAttribute("center-transparent", "false");
    else menu.removeAttribute("center-transparent");

    menu.setAttribute("edge-behavior", config.edgeBehavior);
    menu.setAttribute("start-angle", String(config.startAngle));
    menu.setAttribute("sweep-angle", String(config.sweepAngle));
    menu.setAttribute("center-deadzone", String(config.deadzone));
  }, [config, ready]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (ready) menuRef.current?.open(e.clientX, e.clientY);
    },
    [ready],
  );

  // Icon drag handlers
  const handleIconDragStart = useCallback(
    (e: React.DragEvent, icon: { type: string; label: string }) => {
      setDragData(icon);
      e.dataTransfer.setData("text/plain", icon.type);
      (e.currentTarget as HTMLElement).style.opacity = "0.3";
      if (ready) menuRef.current?.openAsDropTarget(e.clientX, e.clientY);
    },
    [ready],
  );

  const handleIconDrag = useCallback((e: React.DragEvent) => {
    if (e.clientX !== 0 || e.clientY !== 0) {
      menuRef.current?.updateHoverFromPoint(e.clientX, e.clientY);
    }
  }, []);

  const handleIconDragEnd = useCallback(
    (e: React.DragEvent) => {
      (e.currentTarget as HTMLElement).style.opacity = "";
      const menu = menuRef.current;
      if (menu?.isOpen) {
        const result = menu.dropOnHovered(dragData);
        if (result) {
          setLog(`Icon "${dragData?.label}" → ${result.label}`);
        } else {
          setLog(`Drag cancelled for "${dragData?.label}"`);
          menu.cancelDrop();
        }
      }
      setDragData(null);
    },
    [dragData],
  );

  // Allow drag over document when menu is open as drop target
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      const menu = menuRef.current;
      if (menu?.isOpen && menu?.isDropTarget) {
        e.preventDefault();
      }
    };
    document.addEventListener("dragover", handleDragOver);
    return () => document.removeEventListener("dragover", handleDragOver);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#08080a",
        color: "#fff",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Nav */}
      <nav
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "16px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <Link
            to="/"
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "rgba(255,255,255,0.8)",
              textDecoration: "none",
            }}
          >
            ray-menu
          </Link>
          <span
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.4)",
            }}
          >
            playground
          </span>
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          <Link
            to="/docs/$"
            params={{ _splat: "" }}
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.35)",
              textDecoration: "none",
            }}
          >
            docs
          </Link>
          <a
            href="https://github.com/agmmnn/ray-menu"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.35)",
              textDecoration: "none",
            }}
          >
            github
          </a>
        </div>
      </nav>

      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Controls */}
        <div
          style={{
            padding: "16px 20px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 8,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "rgba(255,255,255,0.5)",
              marginBottom: 12,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Configuration
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
            }}
          >
            <Checkbox
              label="Infinite Selection"
              checked={config.infinite}
              onChange={(v) => setConfig((c) => ({ ...c, infinite: v }))}
            />
            <Checkbox
              label="Trail Path"
              checked={config.trailPath}
              onChange={(v) => setConfig((c) => ({ ...c, trailPath: v }))}
            />
            <Checkbox
              label="Anchor Line"
              checked={config.anchorLine}
              onChange={(v) => setConfig((c) => ({ ...c, anchorLine: v }))}
            />
            <Checkbox
              label="Center Transparent"
              checked={config.centerTransparent}
              onChange={(v) =>
                setConfig((c) => ({ ...c, centerTransparent: v }))
              }
            />
            <SelectControl
              label="Edge Behavior"
              value={config.edgeBehavior}
              options={["flip", "shift", "none"]}
              onChange={(v) => setConfig((c) => ({ ...c, edgeBehavior: v }))}
            />
            <SelectControl
              label="Preset"
              value="full"
              options={Object.keys(fanPresets)}
              onChange={(v) => {
                const p = fanPresets[v];
                if (p)
                  setConfig((c) => ({
                    ...c,
                    startAngle: p.start,
                    sweepAngle: p.sweep,
                  }));
              }}
            />
            <RangeControl
              label="Start Angle"
              value={config.startAngle}
              min={-180}
              max={180}
              suffix="\u00b0"
              onChange={(v) => setConfig((c) => ({ ...c, startAngle: v }))}
            />
            <RangeControl
              label="Sweep Angle"
              value={config.sweepAngle}
              min={45}
              max={360}
              suffix="\u00b0"
              onChange={(v) => setConfig((c) => ({ ...c, sweepAngle: v }))}
            />
            <RangeControl
              label="Deadzone"
              value={config.deadzone}
              min={10}
              max={60}
              suffix="px"
              onChange={(v) => setConfig((c) => ({ ...c, deadzone: v }))}
            />
          </div>
        </div>

        {/* Demo area */}
        <div
          onContextMenu={handleContextMenu}
          style={{
            height: 400,
            background: "rgba(255,255,255,0.015)",
            border: "1px dashed rgba(255,255,255,0.08)",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "context-menu",
            transition: "border-color 0.2s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")
          }
        >
          <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 13 }}>
            {ready ? "Right-click here" : "Loading..."}
          </span>
        </div>

        {/* Icon Drag Demo */}
        <div
          style={{
            padding: "16px 20px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 8,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "rgba(255,255,255,0.5)",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Drag & Drop
          </div>
          <div
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.3)",
              marginBottom: 12,
            }}
          >
            Drag an icon — radial menu appears instantly at cursor
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              { type: "image", label: "Image", emoji: "🖼️" },
              { type: "video", label: "Video", emoji: "🎬" },
              { type: "music", label: "Music", emoji: "🎵" },
              { type: "doc", label: "Document", emoji: "📄" },
              { type: "code", label: "Code", emoji: "💻" },
              { type: "link", label: "Link", emoji: "🔗" },
            ].map((icon) => (
              <div
                key={icon.type}
                draggable
                onDragStart={(e) => handleIconDragStart(e, icon)}
                onDrag={handleIconDrag}
                onDragEnd={handleIconDragEnd}
                title={icon.label}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  cursor: "grab",
                  userSelect: "none",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                  transition: "transform 0.15s, border-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                }}
              >
                {icon.emoji}
              </div>
            ))}
          </div>
        </div>

        {/* Hints */}
        <div
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.25)",
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: "rgba(255,255,255,0.4)" }}>Keyboard:</strong>{" "}
          ←/→ navigate, ↓/Enter select, ↑/Backspace go back, Escape close, 1-9
          quick select.
          <br />
          <strong style={{ color: "rgba(255,255,255,0.4)" }}>
            Submenus:
          </strong>{" "}
          Click items with ▸ to enter. Click center to go back. "Move to" loads
          async.
        </div>

        {/* Log */}
        <div
          style={{
            padding: "10px 16px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 6,
            fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
            fontSize: 12,
            color: "rgba(100, 180, 255, 0.8)",
          }}
        >
          {log}
        </div>
      </div>

      {/* @ts-expect-error -- web component */}
      <ray-menu
        ref={menuRef}
        radius="140"
        inner-radius="45"
        infinite-selection
        center-deadzone="30"
      />
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        cursor: "pointer",
        fontSize: 13,
        color: "rgba(255,255,255,0.6)",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: 14, height: 14 }}
      />
      {label}
    </label>
  );
}

function SelectControl({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: "rgba(255,255,255,0.05)",
          color: "rgba(255,255,255,0.7)",
          border: "1px solid rgba(255,255,255,0.08)",
          padding: "6px 8px",
          borderRadius: 4,
          fontSize: 12,
        }}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function RangeControl({
  label,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
        {label}: {value}
        {suffix}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%" }}
      />
    </div>
  );
}
