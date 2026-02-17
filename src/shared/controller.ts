import type { MenuItem, EdgeBehavior, Point } from "../core";
import type {
  RayMenuDropDetail,
  RayMenuSubmenuDetail,
  RayMenuLoadErrorDetail,
} from "../wc/ray-menu-types";

export interface RayMenuControllerOptions {
  items: MenuItem[];
  radius?: number;
  innerRadius?: number;
  infiniteSelection?: boolean;
  centerDeadzone?: number;
  infiniteThreshold?: number;
  edgeBehavior?: EdgeBehavior;
  showTrailPath?: boolean;
  showAnchorLine?: boolean;
  centerTransparent?: boolean;
  instantDragThrough?: boolean;
  scrollBehavior?: "close" | "keep" | "lock" | "none";
  scrollThreshold?: number;
  startAngle?: number;
  sweepAngle?: number;
  static?: boolean;
  defaultOpen?: boolean;
  onSelect?: (item: MenuItem) => void;
  onDrop?: (detail: RayMenuDropDetail) => void;
  onOpen?: (position: Point) => void;
  onClose?: () => void;
  onSubmenuEnter?: (detail: RayMenuSubmenuDetail) => void;
  onSubmenuExit?: (detail: RayMenuSubmenuDetail) => void;
  onSpringLoad?: (item: MenuItem) => void;
  onLoadStart?: (item: MenuItem) => void;
  onLoadComplete?: (item: MenuItem) => void;
  onLoadError?: (detail: RayMenuLoadErrorDetail) => void;
}

type RayMenuElement = HTMLElement & {
  items: MenuItem[];
  isOpen: boolean;
  isDropTarget: boolean;
  isLoading: boolean;
  submenuDepth: number;
  open(x: number, y: number): void;
  close(): void;
  toggle(x: number, y: number): void;
  goBack(): boolean;
  goToRoot(): void;
  openAsDropTarget(x: number, y: number): void;
  updateHoverFromPoint(x: number, y: number): void;
  dropOnHovered(data?: unknown): MenuItem | null;
  cancelDrop(): void;
  getHoveredItem(): MenuItem | null;
};

const ATTR_MAP: Record<string, string> = {
  radius: "radius",
  innerRadius: "inner-radius",
  infiniteSelection: "infinite-selection",
  centerDeadzone: "center-deadzone",
  infiniteThreshold: "infinite-threshold",
  edgeBehavior: "edge-behavior",
  showTrailPath: "show-trail-path",
  showAnchorLine: "show-anchor-line",
  centerTransparent: "center-transparent",
  instantDragThrough: "instant-drag-through",
  scrollBehavior: "scroll-behavior",
  scrollThreshold: "scroll-threshold",
  startAngle: "start-angle",
  sweepAngle: "sweep-angle",
  static: "static",
  defaultOpen: "default-open",
};

const BOOLEAN_ATTRS = new Set([
  "infiniteSelection",
  "showTrailPath",
  "showAnchorLine",
  "centerTransparent",
  "instantDragThrough",
  "static",
  "defaultOpen",
]);

const EVENT_MAP: Record<string, string> = {
  onSelect: "ray-select",
  onDrop: "ray-drop",
  onOpen: "ray-open",
  onClose: "ray-close",
  onSubmenuEnter: "ray-submenu-enter",
  onSubmenuExit: "ray-submenu-exit",
  onSpringLoad: "ray-spring-load",
  onLoadStart: "ray-load-start",
  onLoadComplete: "ray-load-complete",
  onLoadError: "ray-load-error",
};

export class RayMenuController {
  private _el: RayMenuElement | null = null;
  private _listeners: Array<{ event: string; handler: EventListener }> = [];
  private _options: RayMenuControllerOptions;

  constructor(options: RayMenuControllerOptions) {
    this._options = options;
  }

  async init(): Promise<void> {
    // Dynamically import to register the <ray-menu> custom element.
    // This is async to support SSR environments where the WC can't
    // be imported at the top level.
    if (
      typeof customElements !== "undefined" &&
      !customElements.get("ray-menu")
    ) {
      await import("../wc/index");
    }

    const el = document.createElement("ray-menu") as RayMenuElement;
    this._el = el;

    this._syncAttributes(this._options);
    this._syncItems(this._options.items);
    this._syncEvents(this._options);

    document.body.appendChild(el);
  }

  update(options: RayMenuControllerOptions): void {
    if (!this._el) return;
    this._options = options;

    // Don't sync attributes during close animation - it triggers re-renders
    const isClosing = this._el.hasAttribute("data-closing") ||
      this._el.shadowRoot?.querySelector(".ray-menu-container[data-closing]");

    if (!isClosing) {
      this._syncAttributes(options);
      this._syncItems(options.items);
    }

    // Re-wire events (remove old, add new)
    this._removeEvents();
    this._syncEvents(options);
  }

  destroy(): void {
    if (!this._el) return;
    this._removeEvents();
    this._el.remove();
    this._el = null;
  }

  // --- Imperative methods ---

  open(x: number, y: number): void {
    this._el?.open(x, y);
  }

  close(): void {
    this._el?.close();
  }

  toggle(x: number, y: number): void {
    this._el?.toggle(x, y);
  }

  goBack(): boolean {
    return this._el?.goBack() ?? false;
  }

  goToRoot(): void {
    this._el?.goToRoot();
  }

  // --- Drag API ---

  openAsDropTarget(x: number, y: number): void {
    this._el?.openAsDropTarget(x, y);
  }

  updateHoverFromPoint(x: number, y: number): void {
    this._el?.updateHoverFromPoint(x, y);
  }

  dropOnHovered(data?: unknown): MenuItem | null {
    return this._el?.dropOnHovered(data) ?? null;
  }

  cancelDrop(): void {
    this._el?.cancelDrop();
  }

  getHoveredItem(): MenuItem | null {
    return this._el?.getHoveredItem() ?? null;
  }

  // --- Getters ---

  get isOpen(): boolean {
    return this._el?.isOpen ?? false;
  }

  get isDropTarget(): boolean {
    return this._el?.isDropTarget ?? false;
  }

  get isLoading(): boolean {
    return this._el?.isLoading ?? false;
  }

  get submenuDepth(): number {
    return this._el?.submenuDepth ?? 0;
  }

  get items(): MenuItem[] {
    return this._el?.items ?? [];
  }

  get element(): HTMLElement | null {
    return this._el;
  }

  // --- Private ---

  private _syncAttributes(options: RayMenuControllerOptions): void {
    if (!this._el) return;

    for (const [prop, attr] of Object.entries(ATTR_MAP)) {
      const value = options[prop as keyof RayMenuControllerOptions];

      if (value === undefined) {
        this._el.removeAttribute(attr);
        continue;
      }

      if (BOOLEAN_ATTRS.has(prop)) {
        if (value) {
          this._el.setAttribute(attr, "");
        } else {
          this._el.removeAttribute(attr);
        }
      } else {
        this._el.setAttribute(attr, String(value));
      }
    }
  }

  private _syncItems(items: MenuItem[]): void {
    if (!this._el) return;
    this._el.items = items;
  }

  private _syncEvents(options: RayMenuControllerOptions): void {
    if (!this._el) return;

    for (const [prop, eventName] of Object.entries(EVENT_MAP)) {
      const callback = options[prop as keyof RayMenuControllerOptions];
      if (typeof callback !== "function") continue;

      const handler = ((e: CustomEvent) => {
        (callback as (detail: unknown) => void)(e.detail);
      }) as EventListener;

      this._el.addEventListener(eventName, handler);
      this._listeners.push({ event: eventName, handler });
    }
  }

  private _removeEvents(): void {
    if (!this._el) return;
    for (const { event, handler } of this._listeners) {
      this._el.removeEventListener(event, handler);
    }
    this._listeners = [];
  }
}
