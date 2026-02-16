/**
 * Core angle calculation utilities using atan2
 * All angles are in radians unless otherwise specified
 */

export interface Point {
  x: number;
  y: number;
}

export interface PolarCoord {
  angle: number;
  distance: number;
}

/**
 * Calculate angle from center to point using atan2
 * Returns angle in radians, where 0 is right (3 o'clock), PI/2 is down
 */
export function angleFromCenter(center: Point, point: Point): number {
  return Math.atan2(point.y - center.y, point.x - center.x);
}

/**
 * Convert radians to degrees
 */
export function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Convert degrees to radians
 */
export function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Normalize angle to [0, 2PI) range
 */
export function normalizeAngle(angle: number): number {
  const twoPi = Math.PI * 2;
  return ((angle % twoPi) + twoPi) % twoPi;
}

/**
 * Normalize angle to [-PI, PI) range
 */
export function normalizeAngleSigned(angle: number): number {
  let normalized = normalizeAngle(angle);
  if (normalized >= Math.PI) {
    normalized -= Math.PI * 2;
  }
  return normalized;
}

/**
 * Calculate distance between two points
 */
export function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Convert Cartesian coordinates to polar (relative to center)
 */
export function toPolar(center: Point, point: Point): PolarCoord {
  return {
    angle: angleFromCenter(center, point),
    distance: distance(center, point),
  };
}

/**
 * Convert polar coordinates to Cartesian (relative to center)
 */
export function toCartesian(center: Point, polar: PolarCoord): Point {
  return {
    x: center.x + polar.distance * Math.cos(polar.angle),
    y: center.y + polar.distance * Math.sin(polar.angle),
  };
}

/**
 * Calculate the angular difference between two angles (shortest path)
 */
export function angleDifference(angle1: number, angle2: number): number {
  const diff = normalizeAngle(angle2 - angle1);
  return diff > Math.PI ? diff - Math.PI * 2 : diff;
}

/**
 * Check if an angle is within a sector defined by start and sweep
 * @param angle - The angle to check
 * @param startAngle - Start of the sector
 * @param sweepAngle - Angular width of the sector (can be negative for CCW)
 */
export function isAngleInSector(
  angle: number,
  startAngle: number,
  sweepAngle: number,
): boolean {
  const normalizedAngle = normalizeAngle(angle - startAngle);
  const normalizedSweep = Math.abs(sweepAngle);

  if (sweepAngle >= 0) {
    return normalizedAngle <= normalizedSweep;
  } else {
    return normalizedAngle >= Math.PI * 2 - normalizedSweep;
  }
}

/**
 * Distribute items evenly around a circle
 * @param count - Number of items
 * @param startAngle - Starting angle (default: -PI/2, top)
 * @param sweepAngle - Total angular span (default: 2PI, full circle)
 * @returns Array of angles for each item
 */
export function distributeAngles(
  count: number,
  startAngle: number = -Math.PI / 2,
  sweepAngle: number = Math.PI * 2,
): number[] {
  if (count <= 0) return [];
  if (count === 1) return [startAngle];

  const step = sweepAngle / count;
  return Array.from(
    { length: count },
    (_, i) => startAngle + step * i + step / 2,
  );
}

/**
 * Get the closest item index based on pointer angle
 */
export function getClosestItemIndex(
  pointerAngle: number,
  itemAngles: number[],
): number {
  if (itemAngles.length === 0) return -1;

  let closestIndex = 0;
  let smallestDiff = Math.abs(angleDifference(pointerAngle, itemAngles[0]));

  for (let i = 1; i < itemAngles.length; i++) {
    const diff = Math.abs(angleDifference(pointerAngle, itemAngles[i]));
    if (diff < smallestDiff) {
      smallestDiff = diff;
      closestIndex = i;
    }
  }

  return closestIndex;
}
