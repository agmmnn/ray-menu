import type { MenuItem, MenuConfig } from "../core";
import { distributeAngles, toCartesian } from "../core";
import type { NavStackEntry } from "./ray-menu-types";

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * Describe an arc path for SVG
 */
export function describeArc(
  x: number,
  y: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
): string {
  const startOuter = {
    x: x + outerRadius * Math.cos(startAngle),
    y: y + outerRadius * Math.sin(startAngle),
  };
  const endOuter = {
    x: x + outerRadius * Math.cos(endAngle),
    y: y + outerRadius * Math.sin(endAngle),
  };
  const startInner = {
    x: x + innerRadius * Math.cos(endAngle),
    y: y + innerRadius * Math.sin(endAngle),
  };
  const endInner = {
    x: x + innerRadius * Math.cos(startAngle),
    y: y + innerRadius * Math.sin(startAngle),
  };

  const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${endInner.x} ${endInner.y}`,
    "Z",
  ].join(" ");
}

/**
 * Create SVG defs with glow filter
 */
export function createSvgDefs(): SVGDefsElement {
  const defs = document.createElementNS(SVG_NS, "defs");
  const filter = document.createElementNS(SVG_NS, "filter");
  filter.setAttribute("id", "glow");
  filter.setAttribute("x", "-50%");
  filter.setAttribute("y", "-50%");
  filter.setAttribute("width", "200%");
  filter.setAttribute("height", "200%");

  const blur = document.createElementNS(SVG_NS, "feGaussianBlur");
  blur.setAttribute("stdDeviation", "3");
  blur.setAttribute("result", "coloredBlur");

  const merge = document.createElementNS(SVG_NS, "feMerge");
  const mergeNode1 = document.createElementNS(SVG_NS, "feMergeNode");
  mergeNode1.setAttribute("in", "coloredBlur");
  const mergeNode2 = document.createElementNS(SVG_NS, "feMergeNode");
  mergeNode2.setAttribute("in", "SourceGraphic");

  merge.appendChild(mergeNode1);
  merge.appendChild(mergeNode2);
  filter.appendChild(blur);
  filter.appendChild(merge);
  defs.appendChild(filter);

  return defs;
}

/**
 * Create the main SVG element
 */
export function createMenuSvg(
  radius: number,
  isDropTarget: boolean,
): SVGSVGElement {
  const svgSize = radius * 2 + 40;
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "ray-menu-svg");
  svg.setAttribute("width", String(svgSize));
  svg.setAttribute("height", String(svgSize));
  svg.setAttribute("viewBox", `0 0 ${svgSize} ${svgSize}`);

  if (isDropTarget) {
    svg.style.pointerEvents = "none";
  }

  svg.appendChild(createSvgDefs());
  return svg;
}

/**
 * Create outer ring - circle for full 360°, arc path for partial sweeps
 */
export function createOuterRing(
  radius: number,
  startAngle: number = -Math.PI / 2,
  sweepAngle: number = Math.PI * 2,
): SVGElement {
  const center = radius + 20;
  const isFan = Math.abs(sweepAngle) < Math.PI * 2 - 0.01;

  if (isFan) {
    // Create arc path for fan layouts
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("class", "ray-menu-outer-ring");

    const endAngle = startAngle + sweepAngle;
    const startX = center + radius * Math.cos(startAngle);
    const startY = center + radius * Math.sin(startAngle);
    const endX = center + radius * Math.cos(endAngle);
    const endY = center + radius * Math.sin(endAngle);
    const largeArcFlag = Math.abs(sweepAngle) > Math.PI ? 1 : 0;
    const sweepFlag = sweepAngle > 0 ? 1 : 0;

    path.setAttribute(
      "d",
      `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`,
    );
    return path;
  } else {
    // Full circle
    const ring = document.createElementNS(SVG_NS, "circle");
    ring.setAttribute("class", "ray-menu-outer-ring");
    ring.setAttribute("cx", String(center));
    ring.setAttribute("cy", String(center));
    ring.setAttribute("r", String(radius));
    return ring;
  }
}

/**
 * Create inner ring - circle for full 360°, arc path for partial sweeps
 */
export function createInnerRing(
  radius: number,
  innerRadius: number,
  transparent: boolean,
  startAngle: number = -Math.PI / 2,
  sweepAngle: number = Math.PI * 2,
): SVGElement {
  const center = radius + 20;
  const isFan = Math.abs(sweepAngle) < Math.PI * 2 - 0.01;

  if (isFan && !transparent) {
    // Create filled arc for fan layouts (center background)
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("class", "ray-menu-inner-ring");
    path.setAttribute("data-transparent", String(transparent));

    // Create a pie-slice from center to innerRadius
    const endAngle = startAngle + sweepAngle;
    const startX = center + innerRadius * Math.cos(startAngle);
    const startY = center + innerRadius * Math.sin(startAngle);
    const endX = center + innerRadius * Math.cos(endAngle);
    const endY = center + innerRadius * Math.sin(endAngle);
    const largeArcFlag = Math.abs(sweepAngle) > Math.PI ? 1 : 0;
    const sweepFlag = sweepAngle > 0 ? 1 : 0;

    path.setAttribute(
      "d",
      `M ${center} ${center} L ${startX} ${startY} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY} Z`,
    );
    return path;
  } else {
    // Full circle
    const ring = document.createElementNS(SVG_NS, "circle");
    ring.setAttribute("class", "ray-menu-inner-ring");
    ring.setAttribute("cx", String(center));
    ring.setAttribute("cy", String(center));
    ring.setAttribute("r", String(innerRadius));
    ring.setAttribute("data-transparent", String(transparent));
    return ring;
  }
}

/**
 * Create an arc path element for a menu item
 */
export function createArcPath(
  centerX: number,
  centerY: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
  isHovered: boolean,
  isDisabled: boolean,
  index: number,
): SVGPathElement {
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("class", "ray-menu-arc");
  path.setAttribute(
    "d",
    describeArc(
      centerX,
      centerY,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
    ),
  );
  path.setAttribute("data-hovered", String(isHovered));
  path.setAttribute("data-disabled", String(isDisabled));
  path.setAttribute("data-index", String(index));
  return path;
}

export interface CreateLabelOptions {
  item: MenuItem;
  angle: number;
  innerRadius: number;
  outerRadius: number;
  isHovered: boolean;
  isFocused: boolean;
  isDropTarget: boolean;
  index: number;
  showKeyHint: boolean;
}

/**
 * Create a label element for a menu item
 */
export function createLabel(options: CreateLabelOptions): HTMLDivElement {
  const {
    item,
    angle,
    innerRadius,
    outerRadius,
    isHovered,
    isFocused,
    isDropTarget,
    index,
    showKeyHint,
  } = options;

  const labelPos = toCartesian(
    { x: 0, y: 0 },
    { angle, distance: (innerRadius + outerRadius) / 2 },
  );

  const label = document.createElement("div");
  label.className = "ray-menu-label";
  label.id = `ray-menu-item-${index}`;
  label.style.left = `${labelPos.x}px`;
  label.style.top = `${labelPos.y}px`;

  if (isDropTarget) {
    label.style.pointerEvents = "none";
  }

  // ARIA
  label.setAttribute("role", "menuitem");
  if (item.disabled) {
    label.setAttribute("aria-disabled", "true");
  }
  const hasChildren = item.children && item.children.length > 0;
  const canLoadChildren = typeof item.loadChildren === "function";
  if (hasChildren || canLoadChildren) {
    label.setAttribute("aria-haspopup", "menu");
  }

  label.setAttribute("data-hovered", String(isHovered));
  label.setAttribute("data-focused", String(isFocused));
  label.setAttribute("data-disabled", String(item.disabled || false));
  label.setAttribute("data-index", String(index));

  // Key hint for keyboard navigation (1-9)
  if (showKeyHint && index < 9) {
    const keyHint = document.createElement("span");
    keyHint.className = "ray-menu-key-hint";
    keyHint.setAttribute("aria-hidden", "true");
    keyHint.textContent = String(index + 1);
    label.appendChild(keyHint);
  }

  const labelText = document.createElement("span");
  labelText.textContent = item.label;
  label.appendChild(labelText);

  if (item.shortcut) {
    const shortcut = document.createElement("span");
    shortcut.className = "ray-menu-shortcut";
    shortcut.textContent = item.shortcut;
    label.appendChild(shortcut);
  }

  if (hasChildren || canLoadChildren) {
    const indicator = document.createElement("span");
    indicator.className = "ray-menu-submenu-indicator";
    indicator.setAttribute("aria-hidden", "true");
    indicator.textContent = "▸";
    label.appendChild(indicator);
  }

  return label;
}

/**
 * Create back indicator element for submenu navigation
 */
export function createBackIndicator(
  innerRadius: number,
  centerSafeZone: number,
): HTMLDivElement {
  const backZoneSize = (innerRadius - centerSafeZone) * 2;

  const indicator = document.createElement("div");
  indicator.className = "ray-menu-back-indicator";
  indicator.setAttribute("role", "button");
  indicator.setAttribute("aria-label", "Go back");
  indicator.setAttribute("data-active", "false");

  const backZone = document.createElement("div");
  backZone.className = "back-zone";
  backZone.style.width = `${backZoneSize}px`;
  backZone.style.height = `${backZoneSize}px`;

  const progress = document.createElement("div");
  progress.className = "back-progress";
  progress.style.width = `${backZoneSize + 6}px`;
  progress.style.height = `${backZoneSize + 6}px`;

  const icon = document.createElement("div");
  icon.className = "back-icon";
  icon.textContent = "↩";

  indicator.appendChild(backZone);
  indicator.appendChild(progress);
  indicator.appendChild(icon);

  return indicator;
}

/**
 * Create a bubble (circle) element for a menu item in bubble variant
 */
export function createBubble(
  centerX: number,
  centerY: number,
  angle: number,
  placementRadius: number,
  bubbleRadius: number,
  isHovered: boolean,
  isDisabled: boolean,
  index: number,
): SVGCircleElement {
  const pos = toCartesian(
    { x: centerX, y: centerY },
    { angle, distance: placementRadius },
  );

  const circle = document.createElementNS(SVG_NS, "circle");
  circle.setAttribute("class", "ray-menu-bubble");
  circle.setAttribute("cx", String(pos.x));
  circle.setAttribute("cy", String(pos.y));
  circle.setAttribute("r", String(bubbleRadius));
  circle.setAttribute("data-hovered", String(isHovered));
  circle.setAttribute("data-disabled", String(isDisabled));
  circle.setAttribute("data-index", String(index));
  return circle;
}

/**
 * Create a label element for a bubble menu item
 */
export function createBubbleLabel(options: CreateLabelOptions): HTMLDivElement {
  const {
    item,
    angle,
    innerRadius,
    outerRadius,
    isHovered,
    isFocused,
    isDropTarget,
    index,
    showKeyHint,
  } = options;

  const labelPos = toCartesian(
    { x: 0, y: 0 },
    { angle, distance: (innerRadius + outerRadius) / 2 },
  );

  const label = document.createElement("div");
  label.className = "ray-menu-label ray-menu-bubble-label";
  label.id = `ray-menu-item-${index}`;
  label.style.left = `${labelPos.x}px`;
  label.style.top = `${labelPos.y}px`;

  if (isDropTarget) {
    label.style.pointerEvents = "none";
  }

  // ARIA
  label.setAttribute("role", "menuitem");
  if (item.disabled) {
    label.setAttribute("aria-disabled", "true");
  }
  const hasChildren = item.children && item.children.length > 0;
  const canLoadChildren = typeof item.loadChildren === "function";
  if (hasChildren || canLoadChildren) {
    label.setAttribute("aria-haspopup", "menu");
  }

  label.setAttribute("data-hovered", String(isHovered));
  label.setAttribute("data-focused", String(isFocused));
  label.setAttribute("data-disabled", String(item.disabled || false));
  label.setAttribute("data-index", String(index));

  // Key hint for keyboard navigation (1-9)
  if (showKeyHint && index < 9) {
    const keyHint = document.createElement("span");
    keyHint.className = "ray-menu-key-hint";
    keyHint.setAttribute("aria-hidden", "true");
    keyHint.textContent = String(index + 1);
    label.appendChild(keyHint);
  }

  // Icon (displayed large above text)
  if (item.icon) {
    const icon = document.createElement("span");
    icon.className = "ray-menu-bubble-icon";
    icon.textContent = item.icon;
    label.appendChild(icon);
  }

  // Label text
  const labelText = document.createElement("span");
  labelText.className = "ray-menu-bubble-text";
  labelText.textContent = item.label;
  label.appendChild(labelText);

  // Submenu indicator
  if (hasChildren || canLoadChildren) {
    const indicator = document.createElement("span");
    indicator.className = "ray-menu-submenu-indicator";
    indicator.setAttribute("aria-hidden", "true");
    indicator.textContent = "▸";
    label.appendChild(indicator);
  }

  return label;
}

/**
 * Calculate fan layout for a bubble submenu branching off a parent bubble.
 */
export function calculateBubbleSubmenuLayout(
  parentCenter: { x: number; y: number },
  parentAngle: number,
  childCount: number,
  submenuRadius: number,
): { centers: { x: number; y: number }[]; angles: number[] } {
  if (childCount <= 0) return { centers: [], angles: [] };

  const fanSweep = Math.min(childCount * 0.6, Math.PI);
  const fanStart = parentAngle - fanSweep / 2;

  const angles = distributeAngles(childCount, fanStart, fanSweep);
  const centers = angles.map((angle) =>
    toCartesian(parentCenter, { angle, distance: submenuRadius }),
  );

  return { centers, angles };
}

/**
 * Adjust the submenu fan angle so all children stay within viewport bounds.
 * parentScreenPos is the parent bubble center in screen coordinates.
 * Returns the adjusted parentAngle.
 */
export function adjustBubbleSubmenuFanAngle(
  parentScreenPos: { x: number; y: number },
  parentAngle: number,
  childCount: number,
  submenuRadius: number,
  viewport: { width: number; height: number },
  padding: number = 30,
): number {
  if (childCount <= 0) return parentAngle;

  const fanSweep = Math.min(childCount * 0.6, Math.PI);

  // Test the current layout
  const testAngles = distributeAngles(
    childCount,
    parentAngle - fanSweep / 2,
    fanSweep,
  );

  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const angle of testAngles) {
    const x = parentScreenPos.x + submenuRadius * Math.cos(angle);
    const y = parentScreenPos.y + submenuRadius * Math.sin(angle);
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }

  // If everything fits, no adjustment needed
  if (
    minX >= padding &&
    maxX <= viewport.width - padding &&
    minY >= padding &&
    maxY <= viewport.height - padding
  ) {
    return parentAngle;
  }

  // Rotate the fan center to push it away from the offending edge
  let adjusted = parentAngle;

  if (maxX > viewport.width - padding) {
    // Fan extends past right edge — rotate toward left (PI)
    adjusted = Math.PI - (maxX - (viewport.width - padding)) / submenuRadius;
  } else if (minX < padding) {
    // Fan extends past left edge — rotate toward right (0)
    adjusted = (padding - minX) / submenuRadius;
  }

  if (maxY > viewport.height - padding) {
    // Fan extends past bottom — rotate upward (-PI/2)
    const overY = (maxY - (viewport.height - padding)) / submenuRadius;
    adjusted -= overY;
  } else if (minY < padding) {
    // Fan extends past top — rotate downward (PI/2)
    const overY = (padding - minY) / submenuRadius;
    adjusted += overY;
  }

  return adjusted;
}

/**
 * Create a connector line from parent bubble to submenu cluster center.
 */
export function createConnector(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): SVGLineElement {
  const line = document.createElementNS(SVG_NS, "line");
  line.setAttribute("class", "ray-menu-connector");
  line.setAttribute("x1", String(x1));
  line.setAttribute("y1", String(y1));
  line.setAttribute("x2", String(x2));
  line.setAttribute("y2", String(y2));
  return line;
}

/**
 * Render root ring + intermediate submenu levels as dimmed bubbles (for bubble variant).
 * Replaces renderParentLevels() when variant is "bubble".
 */
export function renderBubbleParentLevels(
  svg: SVGSVGElement,
  container: HTMLElement,
  navStack: NavStackEntry[],
  config: MenuConfig,
  svgCenter: number,
): void {
  if (navStack.length === 0) return;

  // Render root-level bubbles (dimmed)
  const rootEntry = navStack[0];
  const rootItems = rootEntry.items;
  const rootAngles = distributeAngles(
    rootItems.length,
    config.startAngle,
    config.sweepAngle,
  );

  const placementRadius = (config.innerRadius + config.radius) / 2;
  const maxBubbleRadius = Math.min(
    placementRadius *
      Math.sin(Math.PI / Math.max(rootItems.length, 1)) *
      0.85,
    (config.radius - config.innerRadius) / 2.5,
  );
  const bubbleRadius = Math.min(maxBubbleRadius, 28);

  const selectedRootIndex = rootItems.findIndex(
    (i) => i.id === rootEntry.item.id,
  );

  rootItems.forEach((item, index) => {
    const angle = rootAngles[index];
    const isSelected = index === selectedRootIndex;

    const circle = createBubble(
      svgCenter,
      svgCenter,
      angle,
      placementRadius,
      bubbleRadius,
      false,
      item.disabled || false,
      index,
    );
    circle.setAttribute("data-level", "0");
    circle.setAttribute("data-dimmed", "true");
    if (isSelected) {
      circle.setAttribute("data-selected", "true");
      circle.setAttribute("data-dimmed", "false");
    }
    svg.appendChild(circle);

    // Dimmed labels for root items
    const label = createBubbleLabel({
      item,
      angle,
      innerRadius: config.innerRadius,
      outerRadius: config.radius,
      isHovered: false,
      isFocused: false,
      isDropTarget: false,
      index,
      showKeyHint: false,
    });
    label.setAttribute("data-level", "0");
    label.setAttribute("data-dimmed", "true");
    if (isSelected) {
      label.setAttribute("data-dimmed", "false");
    }
    container.appendChild(label);
  });

  // Render intermediate submenu levels (not the deepest/active one)
  for (let stackIdx = 0; stackIdx < navStack.length - 1; stackIdx++) {
    const entry = navStack[stackIdx];
    if (!entry.parentCenter || !entry.submenuAngles) continue;

    const nextEntry = navStack[stackIdx + 1];
    const childItems = entry.item.children || [];
    const selectedChildIndex = childItems.findIndex(
      (i) => i.id === nextEntry.item.id,
    );

    // Draw connector from parent to submenu cluster center
    const connectorEnd = toCartesian(entry.parentCenter, {
      angle: entry.entryAngle,
      distance: (entry.submenuRadius || 60) * 0.5,
    });
    svg.appendChild(
      createConnector(
        entry.parentCenter.x,
        entry.parentCenter.y,
        connectorEnd.x,
        connectorEnd.y,
      ),
    );

    const subRadius = entry.submenuRadius || 60;
    const subBubbleRadius = Math.min(subRadius * 0.3, 22);

    childItems.forEach((item, index) => {
      const angle = entry.submenuAngles![index];
      const pos = toCartesian(entry.parentCenter!, {
        angle,
        distance: subRadius,
      });

      const circle = document.createElementNS(SVG_NS, "circle");
      circle.setAttribute("class", "ray-menu-bubble");
      circle.setAttribute("cx", String(pos.x));
      circle.setAttribute("cy", String(pos.y));
      circle.setAttribute("r", String(subBubbleRadius));
      circle.setAttribute("data-hovered", "false");
      circle.setAttribute("data-disabled", String(item.disabled || false));
      circle.setAttribute("data-index", String(index));
      circle.setAttribute("data-level", String(stackIdx + 1));
      circle.setAttribute("data-dimmed", "true");
      circle.setAttribute("data-submenu", "true");
      if (index === selectedChildIndex) {
        circle.setAttribute("data-selected", "true");
        circle.setAttribute("data-dimmed", "false");
      }
      svg.appendChild(circle);
    });
  }
}

/**
 * Render parent menu levels as dimmed concentric rings
 */
export function renderParentLevels(
  svg: SVGSVGElement,
  navStack: NavStackEntry[],
  config: MenuConfig,
  submenuRadiusStep: number,
  svgCenter: number,
): void {
  if (navStack.length === 0) return;

  navStack.forEach((entry, stackIndex) => {
    const levelRadius = config.radius + stackIndex * submenuRadiusStep;
    const levelInnerRadius =
      stackIndex === 0
        ? config.innerRadius
        : config.radius + (stackIndex - 1) * submenuRadiusStep;

    const parentItems = entry.items;
    const parentAngles = distributeAngles(
      parentItems.length,
      config.startAngle,
      config.sweepAngle,
    );

    const selectedItemIndex = parentItems.findIndex(
      (i) => i.id === entry.item.id,
    );

    parentItems.forEach((_item, index) => {
      const angle = parentAngles[index];
      const segmentAngle = (Math.PI * 2) / parentItems.length;
      const gap = 0.05;
      const startAngle = angle - segmentAngle / 2 + gap / 2;
      const endAngle = angle + segmentAngle / 2 - gap / 2;

      const isSelected = index === selectedItemIndex;

      const path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("class", "ray-menu-parent-arc");
      path.setAttribute(
        "d",
        describeArc(
          svgCenter + 20,
          svgCenter + 20,
          levelInnerRadius,
          levelRadius,
          startAngle,
          endAngle,
        ),
      );
      path.setAttribute("data-selected", String(isSelected));
      svg.appendChild(path);
    });
  });
}
