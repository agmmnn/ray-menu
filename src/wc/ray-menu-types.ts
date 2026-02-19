import type { MenuItem, Point } from "../core";

/**
 * Navigation stack entry - tracks menu path for drag-back
 */
export interface NavStackEntry {
  /** The parent menu item that was expanded */
  item: MenuItem;
  /** The angle at which this submenu was entered */
  entryAngle: number;
  /** The menu items at this level */
  items: MenuItem[];
  /** Bubble variant: SVG-space center of the parent bubble */
  parentCenter?: Point;
  /** Bubble variant: distance from parent center to child bubbles */
  submenuRadius?: number;
  /** Bubble variant: distributed angles of children relative to parentCenter */
  submenuAngles?: number[];
}

export interface RayMenuDropDetail {
  item: MenuItem;
  data?: unknown;
}

export interface RayMenuSubmenuDetail {
  item: MenuItem;
  depth: number;
}

export interface RayMenuLoadErrorDetail {
  item: MenuItem;
  error: Error;
}

export interface RayMenuEventMap {
  "ray-select": CustomEvent<MenuItem>;
  "ray-drop": CustomEvent<RayMenuDropDetail>;
  "ray-spring-load": CustomEvent<MenuItem>;
  "ray-submenu-enter": CustomEvent<RayMenuSubmenuDetail>;
  "ray-submenu-exit": CustomEvent<RayMenuSubmenuDetail>;
  "ray-load-start": CustomEvent<MenuItem>;
  "ray-load-complete": CustomEvent<MenuItem>;
  "ray-load-error": CustomEvent<RayMenuLoadErrorDetail>;
  "ray-open": CustomEvent<Point>;
  "ray-close": CustomEvent<void>;
}
