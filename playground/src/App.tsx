import { useState, useCallback } from "react";
import {
  TheHelm,
  useRadialMenu,
  type MenuItem,
  type EdgeBehavior,
} from "ray-menu";

const menuItems: MenuItem[] = [
  {
    id: "copy",
    label: "Copy",
    shortcut: "⌘C",
    onSelect: () => console.log("Copy"),
  },
  {
    id: "paste",
    label: "Paste",
    shortcut: "⌘V",
    onSelect: () => console.log("Paste"),
  },
  {
    id: "cut",
    label: "Cut",
    shortcut: "⌘X",
    onSelect: () => console.log("Cut"),
  },
  {
    id: "delete",
    label: "Delete",
    shortcut: "⌫",
    onSelect: () => console.log("Delete"),
  },
  {
    id: "share",
    label: "Share",
    children: [
      {
        id: "share-email",
        label: "Email",
        onSelect: () => console.log("Share via Email"),
      },
      {
        id: "share-link",
        label: "Copy Link",
        onSelect: () => console.log("Copy Link"),
      },
      {
        id: "share-social",
        label: "Social",
        onSelect: () => console.log("Share Social"),
      },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    onSelect: () => console.log("Settings"),
  },
];

function App() {
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [showTrailPath, setShowTrailPath] = useState(true);
  const [showAnchorLine, setShowAnchorLine] = useState(true);
  const [infiniteSelection, setInfiniteSelection] = useState(true);
  const [centerDeadzone, setCenterDeadzone] = useState(30);
  const [edgeBehavior, setEdgeBehavior] = useState<EdgeBehavior>("flip");

  const handleSelect = useCallback((item: MenuItem) => {
    setLastAction(`Selected: ${item.label}`);
    console.log("Selected:", item);
  }, []);

  // Create menu state with the hook
  const menu = useRadialMenu({
    items: menuItems,
    onSelect: handleSelect,
    config: {
      radius: 140,
      innerRadius: 45,
      infiniteSelection,
      centerDeadzone,
      edgeBehavior,
      infiniteThreshold: 0, // 0 = truly infinite
    },
  });

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <header className="max-w-4xl mx-auto mb-12">
        <h1 className="text-4xl font-bold mb-2">Radial Menu Playground</h1>
        <p className="text-zinc-400">
          Right-click anywhere to open the menu. With infinite selection
          enabled, the slice stays selected even when your cursor moves far
          beyond the menu.
        </p>
      </header>

      {/* Controls */}
      <div className="max-w-4xl mx-auto mb-8 p-4 bg-zinc-800/50 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Radial Config API</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Infinite Selection Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={infiniteSelection}
              onChange={(e) => setInfiniteSelection(e.target.checked)}
              className="w-4 h-4"
            />
            <span>Infinite Selection</span>
          </label>

          {/* Trail Path Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showTrailPath}
              onChange={(e) => setShowTrailPath(e.target.checked)}
              className="w-4 h-4"
            />
            <span>Show Trail Path</span>
          </label>

          {/* Anchor Line Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showAnchorLine}
              onChange={(e) => setShowAnchorLine(e.target.checked)}
              className="w-4 h-4"
            />
            <span>Show Anchor Line</span>
          </label>

          {/* Center Deadzone Slider */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-zinc-400">
              Center Deadzone: {centerDeadzone}px
            </label>
            <input
              type="range"
              min="10"
              max="60"
              value={centerDeadzone}
              onChange={(e) => setCenterDeadzone(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Edge Behavior Select */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-zinc-400">Edge Behavior</label>
            <select
              value={edgeBehavior}
              onChange={(e) => setEdgeBehavior(e.target.value as EdgeBehavior)}
              className="bg-zinc-700 text-white px-3 py-1 rounded"
            >
              <option value="flip">Flip</option>
              <option value="shift">Shift</option>
              <option value="none">None</option>
            </select>
          </div>
        </div>

        {lastAction && (
          <p className="mt-4 text-sm text-zinc-400">
            Last action: <span className="text-blue-400">{lastAction}</span>
          </p>
        )}
      </div>

      {/* Demo Areas */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Context Menu Demo */}
        <div className="relative">
          <div
            className="h-64 bg-zinc-800/50 rounded-lg flex items-center justify-center border-2 border-dashed border-zinc-700 hover:border-zinc-500 transition-colors cursor-context-menu"
            onContextMenu={(e) => {
              e.preventDefault();
              menu.open({ x: e.clientX, y: e.clientY });
            }}
          >
            <p className="text-zinc-400 text-center px-4">
              Right-click here
              <br />
              <span className="text-xs text-zinc-500">
                Move cursor far away to test infinite selection
              </span>
            </p>
          </div>
          <p className="mt-2 text-sm text-zinc-500">
            Context menu trigger area
          </p>
        </div>

        {/* Click Demo */}
        <div className="relative">
          <div
            className="h-64 bg-zinc-800/50 rounded-lg flex items-center justify-center border-2 border-dashed border-zinc-700 hover:border-zinc-500 transition-colors cursor-pointer"
            onClick={(e) => {
              menu.toggle({ x: e.clientX, y: e.clientY });
            }}
          >
            <p className="text-zinc-400">Click here to toggle</p>
          </div>
          <p className="mt-2 text-sm text-zinc-500">Click trigger area</p>
        </div>

        {/* Edge Detection Demo */}
        <div className="relative md:col-span-2">
          <div
            className="h-48 bg-zinc-800/50 rounded-lg flex items-center justify-center border-2 border-dashed border-zinc-700 hover:border-zinc-500 transition-colors cursor-context-menu"
            onContextMenu={(e) => {
              e.preventDefault();
              menu.open({ x: e.clientX, y: e.clientY });
            }}
          >
            <p className="text-zinc-400 text-center">
              Right-click near edges to test edge behavior
              <br />
              <span className="text-xs text-zinc-500">
                Try flip vs shift vs none modes
              </span>
            </p>
          </div>
          <p className="mt-2 text-sm text-zinc-500">Edge detection demo area</p>
        </div>
      </div>

      {/* Render the menu */}
      <TheHelm menu={menu} showTrailPath={showTrailPath} showAnchorLine={showAnchorLine} />

      {/* Footer */}
      <footer className="max-w-4xl mx-auto mt-12 pt-8 border-t border-zinc-800 text-center text-zinc-500 text-sm">
        <p>
          Built with{" "}
          <a
            href="https://vitejs.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            Vite
          </a>{" "}
          +{" "}
          <a
            href="https://react.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            React
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
