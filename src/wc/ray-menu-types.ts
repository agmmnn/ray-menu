import type { MenuItem, Point } from '../core'

/**
 * Navigation stack entry - tracks menu path for drag-back
 */
export interface NavStackEntry {
  /** The parent menu item that was expanded */
  item: MenuItem
  /** The angle at which this submenu was entered */
  entryAngle: number
  /** The menu items at this level */
  items: MenuItem[]
}

export interface RayMenuDropDetail {
  item: MenuItem
  data?: unknown
}

export interface RayMenuSubmenuDetail {
  item: MenuItem
  depth: number
}

export interface RayMenuEventMap {
  'ray-select': CustomEvent<MenuItem>
  'ray-drop': CustomEvent<RayMenuDropDetail>
  'ray-spring-load': CustomEvent<MenuItem>
  'ray-submenu-enter': CustomEvent<RayMenuSubmenuDetail>
  'ray-submenu-exit': CustomEvent<RayMenuSubmenuDetail>
  'ray-open': CustomEvent<Point>
  'ray-close': CustomEvent<void>
}
