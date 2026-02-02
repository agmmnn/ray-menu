import { useMemo, useCallback } from "react";
import type { MenuItem, Point } from "@core";

export interface ArcItem {
  item: MenuItem;
  angle: number;
  angleDeg: number;
  isHovered: boolean;
  position: Point;
}

export interface ArcSubMenuProps {
  items: ArcItem[];
  centerX: number;
  centerY: number;
  innerRadius: number;
  outerRadius: number;
  onItemClick: (item: MenuItem) => void;
}

/**
 * Generate SVG arc path data
 */
function describeArc(
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

export function ArcSubMenu({
  items,
  centerX,
  centerY,
  innerRadius,
  outerRadius,
  onItemClick,
}: ArcSubMenuProps) {
  const gap = 0.05; // Gap between segments in radians

  const segments = useMemo(() => {
    if (items.length === 0) return [];

    const segmentAngle = (Math.PI * 2) / items.length;

    return items.map((arcItem) => {
      const startAngle = arcItem.angle - segmentAngle / 2 + gap / 2;
      const endAngle = arcItem.angle + segmentAngle / 2 - gap / 2;

      return {
        ...arcItem,
        startAngle,
        endAngle,
        path: describeArc(
          centerX,
          centerY,
          innerRadius,
          outerRadius,
          startAngle,
          endAngle,
        ),
      };
    });
  }, [items, centerX, centerY, innerRadius, outerRadius]);

  const handleClick = useCallback(
    (item: MenuItem) => (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!item.disabled) {
        onItemClick(item);
      }
    },
    [onItemClick],
  );

  return (
    <g>
      {segments.map((segment) => (
        <path
          key={segment.item.id}
          d={segment.path}
          style={{
            cursor: segment.item.disabled ? "not-allowed" : "pointer",
            transition: "all 150ms ease",
            opacity: segment.item.disabled ? 0.3 : segment.isHovered ? 1 : 0.6,
          }}
          fill={
            segment.isHovered
              ? "rgba(100, 180, 255, 0.4)"
              : "rgba(50, 50, 60, 0.6)"
          }
          stroke={
            segment.isHovered
              ? "rgba(100, 180, 255, 0.7)"
              : "rgba(255, 255, 255, 0.1)"
          }
          strokeWidth={segment.isHovered ? 2 : 1}
          onClick={handleClick(segment.item)}
          role="menuitem"
          aria-label={segment.item.label}
          aria-disabled={segment.item.disabled}
          filter={segment.isHovered ? "url(#glow)" : undefined}
        />
      ))}
    </g>
  );
}

export default ArcSubMenu;
