import React, { useState, useRef, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { useRayMenu } from "ray-menu/react";
import type { MenuItem } from "ray-menu/react";

const basicItems: MenuItem[] = [
  { id: "copy", label: "Copy", icon: "📋" },
  { id: "paste", label: "Paste", icon: "📎" },
  { id: "cut", label: "Cut", icon: "✂️" },
  { id: "delete", label: "Delete", icon: "🗑️" },
  { id: "edit", label: "Edit", icon: "✏️" },
  { id: "share", label: "Share", icon: "🔗" },
];

const submenuItems: MenuItem[] = [
  { id: "file", label: "File", children: [
    { id: "new", label: "New" },
    { id: "open", label: "Open" },
    { id: "save", label: "Save" },
  ]},
  { id: "edit", label: "Edit", children: [
    { id: "undo", label: "Undo" },
    { id: "redo", label: "Redo" },
    { id: "find", label: "Find" },
  ]},
  { id: "view", label: "View" },
  { id: "help", label: "Help" },
];

const manyItems: MenuItem[] = [
  { id: "1", label: "North" },
  { id: "2", label: "NE" },
  { id: "3", label: "East" },
  { id: "4", label: "SE" },
  { id: "5", label: "South" },
  { id: "6", label: "SW" },
  { id: "7", label: "West" },
  { id: "8", label: "NW" },
];

const dropActions: MenuItem[] = [
  { id: "move", label: "Move Here" },
  { id: "copy", label: "Copy Here" },
  { id: "link", label: "Create Link" },
  { id: "cancel", label: "Cancel" },
];

interface DemoProps {
  title: string;
  items: MenuItem[];
  showAnchorLine?: boolean;
  showTrailPath?: boolean;
  radius?: number;
}

function Demo({ title, items, showAnchorLine = false, showTrailPath = false, radius }: DemoProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [lastSelected, setLastSelected] = useState<string | null>(null);
  const circleRef = useRef<HTMLButtonElement>(null);
  const lastCloseTime = useRef(0);

  const menu = useRayMenu({
    items,
    showAnchorLine,
    showTrailPath,
    radius,
    onSelect: (item: MenuItem) => {
      console.log(`[${title}] Selected:`, item.label);
      setLastSelected(item.label);
    },
    onOpen: () => {
      console.log(`[${title}] Menu opened`);
      setIsMenuOpen(true);
    },
    onClose: () => {
      console.log(`[${title}] Menu closed`);
      setIsMenuOpen(false);
      lastCloseTime.current = Date.now();
    },
  });

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (Date.now() - lastCloseTime.current < 200) return;
      const rect = circleRef.current?.getBoundingClientRect();
      if (rect) {
        menu.open(rect.left + rect.width / 2, rect.top + rect.height / 2);
      }
    },
    [menu],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ fontSize: 12, color: "#a1a1aa" }}>{title}</div>
      <button
        ref={circleRef}
        onClick={handleClick}
        style={{
          width: 100,
          height: 100,
          borderRadius: "50%",
          border: "2px solid rgba(255,255,255,0.2)",
          background: isMenuOpen ? "rgba(100,180,255,0.2)" : "transparent",
          cursor: "pointer",
          color: "rgba(255,255,255,0.6)",
          fontSize: 12,
          fontFamily: "system-ui",
          transition: "all 0.2s",
        }}
      >
        {isMenuOpen ? "Open" : "Click"}
      </button>
      {lastSelected && (
        <div style={{ fontSize: 11, color: "#22c55e" }}>Selected: {lastSelected}</div>
      )}
    </div>
  );
}

// Draggable icon component
function DraggableIcon({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", label);
        e.dataTransfer.effectAllowed = "move";
      }}
      style={{
        width: 60,
        height: 60,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        borderRadius: 8,
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(255,255,255,0.05)",
        cursor: "grab",
        fontSize: 24,
        userSelect: "none",
      }}
    >
      <span>{emoji}</span>
      <span style={{ fontSize: 9, color: "#71717a" }}>{label}</span>
    </div>
  );
}

// Drop zone with ray menu
function DropZone() {
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [droppedItem, setDroppedItem] = useState<string | null>(null);

  const menu = useRayMenu({
    items: dropActions,
    onSelect: (item: MenuItem) => {
      console.log("[DropZone] Action:", item.label, "on", droppedItem);
      setLastAction(`${item.label}: ${droppedItem}`);
    },
    onClose: () => {
      setDroppedItem(null);
    },
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (menu.isOpen) {
      menu.updateHoverFromPoint(e.clientX, e.clientY);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("text/plain") || "item";
    setDroppedItem(data);
    menu.openAsDropTarget(e.clientX, e.clientY);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      menu.cancelDrop();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("text/plain");
    setDroppedItem(data);
    const selected = menu.dropOnHovered();
    if (selected) {
      console.log("[DropZone] Dropped:", data, "Action:", selected.label);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div style={{ fontSize: 12, color: "#a1a1aa" }}>Drop Zone</div>
      <div
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          width: 150,
          height: 100,
          borderRadius: 12,
          border: "2px dashed rgba(255,255,255,0.2)",
          background: menu.isOpen ? "rgba(100,180,255,0.1)" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#71717a",
          fontSize: 12,
          transition: "all 0.2s",
        }}
      >
        {menu.isOpen ? "Release to select" : "Drag icons here"}
      </div>
      {lastAction && (
        <div style={{ fontSize: 11, color: "#22c55e" }}>{lastAction}</div>
      )}
    </div>
  );
}

// Drag demo section
function DragDemo() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <div style={{ fontSize: 12, color: "#a1a1aa" }}>Drag & Drop</div>
      <div style={{ display: "flex", gap: 8 }}>
        <DraggableIcon emoji="📄" label="Doc" />
        <DraggableIcon emoji="🖼️" label="Image" />
        <DraggableIcon emoji="🎵" label="Audio" />
      </div>
      <DropZone />
    </div>
  );
}

function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#18181b",
        color: "#fafafa",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: 48,
      }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 500, textAlign: "center", marginBottom: 8 }}>
        React Wrapper Test
      </h1>
      <p style={{ color: "#a1a1aa", textAlign: "center", marginBottom: 48 }}>
        Click circles to open menus. Check console for logs.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 48,
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <Demo title="Basic (6 items)" items={basicItems} />
        <Demo title="With Anchor Line" items={basicItems} showAnchorLine />
        <Demo title="With Trail Path" items={basicItems} showTrailPath />
        <Demo title="Submenus" items={submenuItems} />
        <Demo title="8 Items (compass)" items={manyItems} />
        <Demo title="Large Radius" items={basicItems} radius={180} />
        <DragDemo />
      </div>

      <div style={{ marginTop: 64, color: "#71717a", fontSize: 12, textAlign: "center" }}>
        Open DevTools console to see event flow
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
