/**
 * Core type definitions for the radial menu
 */

import type { Point } from "./angle";

export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  disabled?: boolean;
  /** Whether this item can be selected. Defaults to true. Set to false for items that should only open submenus. */
  selectable?: boolean;
  children?: MenuItem[];
  /** Async function to load children dynamically. Called when submenu is entered if children is empty. */
  loadChildren?: () => Promise<MenuItem[]>;
  onSelect?: () => void;
}

export interface MenuState {
  isOpen: boolean;
  position: Point;
  activeItemId: string | null;
  hoveredItemId: string | null;
  submenuStack: string[];
}

export type EdgeBehavior = "shift" | "flip" | "none";

export interface MenuConfig {
  /** Radius of the main menu ring */
  radius: number;
  /** Inner dead zone radius */
  innerRadius: number;
  /** Angular gap between items (radians) */
  gap: number;
  /** Start angle for item distribution */
  startAngle: number;
  /** Total angular span for items */
  sweepAngle: number;
  /** Animation duration in ms */
  animationDuration: number;
  /** Enable edge detection and repositioning */
  edgeDetection: boolean;
  /** Enable smart flip behavior */
  smartFlip: boolean;
  /** Show drift trace trail */
  showDriftTrace: boolean;
  /** Enable infinite radial selection - sectors extend infinitely outward */
  infiniteSelection: boolean;
  /** Center dead zone radius - no selection within this radius */
  centerDeadzone: number;
  /** Maximum distance for infinite selection (0 = truly infinite) */
  infiniteThreshold: number;
  /** Edge behavior mode */
  edgeBehavior: EdgeBehavior;
}

export const DEFAULT_CONFIG: MenuConfig = {
  radius: 120,
  innerRadius: 40,
  gap: 0.05,
  startAngle: -Math.PI / 2, // Start at top
  sweepAngle: Math.PI * 2, // Full circle
  animationDuration: 200,
  edgeDetection: true,
  smartFlip: true,
  showDriftTrace: false,
  infiniteSelection: true,
  centerDeadzone: 30,
  infiniteThreshold: 0, // 0 = truly infinite
  edgeBehavior: "flip",
};

export interface RadialMenuProps {
  items: MenuItem[];
  config?: Partial<MenuConfig>;
  onSelect?: (item: MenuItem) => void;
  onOpen?: (position: Point) => void;
  onClose?: () => void;
  className?: string;
  trigger?: "contextmenu" | "click" | "manual";
}

export interface ArcSegment {
  id: string;
  startAngle: number;
  endAngle: number;
  innerRadius: number;
  outerRadius: number;
  item: MenuItem;
}

export type { Point, PolarCoord } from "./angle";
export type { Viewport, EdgeState, EdgeConstraints } from "./edge";
export type { FlipState, FlipMode, FlipConfig } from "./flip";
export type {
  Velocity,
  SpringConfig,
  DriftConfig,
  TracePoint,
} from "./physics";
