import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Keyboard,
  MousePointerClick,
  GripVertical,
  Terminal,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "next-themes";

export const Route = createFileRoute("/playground")({
  component: Playground,
  head: () => ({
    meta: [{ title: "Playground - ray-menu" }],
  }),
  ssr: false,
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

const dragIcons = [
  { type: "image", label: "Image", emoji: "\uD83D\uDDBC\uFE0F" },
  { type: "video", label: "Video", emoji: "\uD83C\uDFAC" },
  { type: "music", label: "Music", emoji: "\uD83C\uDFB5" },
  { type: "doc", label: "Document", emoji: "\uD83D\uDCC4" },
  { type: "code", label: "Code", emoji: "\uD83D\uDCBB" },
  { type: "link", label: "Link", emoji: "\uD83D\uDD17" },
];

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme !== "light";
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      <Sun className="size-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute size-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

function Playground() {
  const menuRef = useRef<any>(null);
  const [logs, setLogs] = useState<string[]>([
    "Right-click or click in the demo area",
  ]);
  const [config, setConfig] = useState({
    infinite: true,
    trailPath: false,
    anchorLine: false,
    centerTransparent: true,
    edgeBehavior: "flip",
    preset: "full",
    startAngle: -90,
    sweepAngle: 360,
    deadzone: 30,
  });

  const [ready, setReady] = useState(false);
  const [dragData, setDragData] = useState<{
    type: string;
    label: string;
  } | null>(null);

  const pushLog = useCallback((msg: string) => {
    setLogs((prev) => [...prev.slice(-19), msg]);
  }, []);

  useEffect(() => {
    import("ray-menu").then(() => {
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

    const onSelect = (e: CustomEvent) => pushLog(`Selected: ${e.detail.label}`);
    const onOpen = () => pushLog("Menu opened");
    const onSubmenuEnter = (e: CustomEvent) =>
      pushLog(
        `Entered submenu: ${e.detail.item.label} (depth: ${e.detail.depth})`,
      );
    const onSubmenuExit = (e: CustomEvent) =>
      pushLog(
        `Exited submenu: ${e.detail.item.label} (depth: ${e.detail.depth})`,
      );
    const onLoadError = (e: CustomEvent) =>
      pushLog(`Error: ${e.detail.error.message}`);

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
  }, [ready, pushLog]);

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
          pushLog(`Icon "${dragData?.label}" \u2192 ${result.label}`);
        } else {
          pushLog(`Drag cancelled for "${dragData?.label}"`);
          menu.cancelDrop();
        }
      }
      setDragData(null);
    },
    [dragData, pushLog],
  );

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
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="max-w-[1000px] mx-auto px-6 py-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-foreground hover:opacity-80 transition-opacity no-underline">
            <ArrowLeft className="size-4" />
            ray-menu
          </Link>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm text-muted-foreground">Playground</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/docs/$" params={{ _splat: "" }} className="no-underline">
              Docs
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a
              href="https://github.com/agmmnn/ray-menu"
              target="_blank"
              rel="noopener noreferrer"
              className="no-underline"
            >
              GitHub
            </a>
          </Button>
          <ThemeToggle />
        </div>
      </nav>

      <div className="max-w-[1000px] mx-auto p-6 flex flex-col gap-5">
        {/* Config + Demo grid */}
        <div className="grid grid-cols-[320px_1fr] gap-5 items-start">
          {/* Sidebar: Controls */}
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Options</CardTitle>
                <CardDescription className="text-xs">
                  Toggle menu behaviors
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="infinite" className="text-xs font-normal text-muted-foreground cursor-pointer">
                    Infinite Selection
                  </Label>
                  <Switch
                    id="infinite"
                    size="sm"
                    checked={config.infinite}
                    onCheckedChange={(v) =>
                      setConfig((c) => ({ ...c, infinite: !!v }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="trail" className="text-xs font-normal text-muted-foreground cursor-pointer">
                    Trail Path
                  </Label>
                  <Switch
                    id="trail"
                    size="sm"
                    checked={config.trailPath}
                    onCheckedChange={(v) =>
                      setConfig((c) => ({ ...c, trailPath: !!v }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="anchor" className="text-xs font-normal text-muted-foreground cursor-pointer">
                    Anchor Line
                  </Label>
                  <Switch
                    id="anchor"
                    size="sm"
                    checked={config.anchorLine}
                    onCheckedChange={(v) =>
                      setConfig((c) => ({ ...c, anchorLine: !!v }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="center" className="text-xs font-normal text-muted-foreground cursor-pointer">
                    Center Transparent
                  </Label>
                  <Switch
                    id="center"
                    size="sm"
                    checked={config.centerTransparent}
                    onCheckedChange={(v) =>
                      setConfig((c) => ({ ...c, centerTransparent: !!v }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Layout</CardTitle>
                <CardDescription className="text-xs">
                  Angle and edge configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-normal text-muted-foreground">
                    Edge Behavior
                  </Label>
                  <Select
                    value={config.edgeBehavior}
                    onValueChange={(v) =>
                      setConfig((c) => ({ ...c, edgeBehavior: v }))
                    }
                  >
                    <SelectTrigger size="sm" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flip">Flip</SelectItem>
                      <SelectItem value="shift">Shift</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-normal text-muted-foreground">
                    Preset
                  </Label>
                  <Select
                    value={config.preset}
                    onValueChange={(v) => {
                      const p = fanPresets[v];
                      if (p)
                        setConfig((c) => ({
                          ...c,
                          preset: v,
                          startAngle: p.start,
                          sweepAngle: p.sweep,
                        }));
                    }}
                  >
                    <SelectTrigger size="sm" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(fanPresets).map((key) => (
                        <SelectItem key={key} value={key}>
                          {key}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-normal text-muted-foreground">
                      Start Angle
                    </Label>
                    <Badge variant="outline" className="text-[10px] font-mono tabular-nums">
                      {config.startAngle}&deg;
                    </Badge>
                  </div>
                  <Slider
                    value={[config.startAngle]}
                    min={-180}
                    max={180}
                    step={1}
                    onValueChange={([v]) =>
                      setConfig((c) => ({ ...c, startAngle: v }))
                    }
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-normal text-muted-foreground">
                      Sweep Angle
                    </Label>
                    <Badge variant="outline" className="text-[10px] font-mono tabular-nums">
                      {config.sweepAngle}&deg;
                    </Badge>
                  </div>
                  <Slider
                    value={[config.sweepAngle]}
                    min={45}
                    max={360}
                    step={1}
                    onValueChange={([v]) =>
                      setConfig((c) => ({ ...c, sweepAngle: v }))
                    }
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-normal text-muted-foreground">
                      Deadzone
                    </Label>
                    <Badge variant="outline" className="text-[10px] font-mono tabular-nums">
                      {config.deadzone}px
                    </Badge>
                  </div>
                  <Slider
                    value={[config.deadzone]}
                    min={10}
                    max={60}
                    step={1}
                    onValueChange={([v]) =>
                      setConfig((c) => ({ ...c, deadzone: v }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main area */}
          <div className="flex flex-col gap-4">
            {/* Demo area */}
            <div
              onContextMenu={handleContextMenu}
              className="h-[420px] rounded-xl border border-dashed border-border bg-card/50 flex flex-col items-center justify-center cursor-context-menu transition-colors hover:border-primary/30 hover:bg-card/80 relative overflow-hidden group"
            >
              {/* Subtle radial decoration */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-primary)/3%_0%,transparent_70%)] pointer-events-none" />

              <div className="relative flex flex-col items-center gap-3">
                <MousePointerClick className="size-5 text-muted-foreground/50 group-hover:text-primary/50 transition-colors" />
                <span className="text-sm text-muted-foreground">
                  {ready ? "Right-click to open menu" : "Loading\u2026"}
                </span>
              </div>
            </div>

            {/* Drag & drop */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <GripVertical className="size-4 text-muted-foreground" />
                  <CardTitle className="text-sm">Drag & Drop</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Drag an icon — radial menu appears at cursor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2.5 flex-wrap">
                  {dragIcons.map((icon) => (
                    <div
                      key={icon.type}
                      draggable
                      onDragStart={(e) => handleIconDragStart(e, icon)}
                      onDrag={handleIconDrag}
                      onDragEnd={handleIconDragEnd}
                      title={icon.label}
                      className="size-11 rounded-full flex items-center justify-center text-lg cursor-grab select-none border border-border bg-card hover:border-primary/30 hover:-translate-y-0.5 transition-all active:cursor-grabbing"
                    >
                      {icon.emoji}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Hints */}
            <div className="flex gap-4 text-[11px] text-muted-foreground leading-relaxed">
              <div className="flex gap-1.5 items-start">
                <Keyboard className="size-3.5 mt-px shrink-0 text-muted-foreground/60" />
                <span>
                  <strong className="text-foreground/60">\u2190/\u2192</strong> navigate,{" "}
                  <strong className="text-foreground/60">\u2193/Enter</strong> select,{" "}
                  <strong className="text-foreground/60">\u2191/Backspace</strong> back,{" "}
                  <strong className="text-foreground/60">Esc</strong> close,{" "}
                  <strong className="text-foreground/60">1-9</strong> quick select
                </span>
              </div>
            </div>

            {/* Event log */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="size-4 text-muted-foreground" />
                    <CardTitle className="text-sm">Event Log</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() =>
                      setLogs(["Right-click or click in the demo area"])
                    }
                    className="text-xs text-muted-foreground"
                  >
                    Clear
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div
                  ref={(el) => {
                    if (el) el.scrollTop = el.scrollHeight;
                  }}
                  className="bg-muted/50 rounded-lg p-3 max-h-32 overflow-y-auto font-mono text-xs leading-relaxed"
                >
                  {logs.map((line, i) => (
                    <div
                      key={`${i}-${line}`}
                      className={
                        i === logs.length - 1
                          ? "text-primary"
                          : "text-muted-foreground/60"
                      }
                    >
                      <span className="text-muted-foreground/30 mr-2 select-none">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {line}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
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
