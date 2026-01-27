/**
 * Edge detection and viewport boundary handling
 * Determines optimal menu positioning based on available space
 */

import type { Point } from './angle'

export interface Viewport {
  width: number
  height: number
}

export interface EdgeConstraints {
  top: number
  right: number
  bottom: number
  left: number
}

export interface EdgeState {
  /** Which edges are constrained */
  constrained: {
    top: boolean
    right: boolean
    bottom: boolean
    left: boolean
  }
  /** Available space in each direction */
  available: EdgeConstraints
  /** Suggested offset to keep menu in view */
  offset: Point
  /** Whether any edge is constrained */
  isConstrained: boolean
}

/**
 * Calculate available space from a point to viewport edges
 */
export function getAvailableSpace(
  point: Point,
  viewport: Viewport,
  padding: number = 0
): EdgeConstraints {
  return {
    top: point.y - padding,
    right: viewport.width - point.x - padding,
    bottom: viewport.height - point.y - padding,
    left: point.x - padding,
  }
}

/**
 * Detect which edges would be violated by a menu of given radius
 */
export function detectEdgeConstraints(
  center: Point,
  radius: number,
  viewport: Viewport,
  padding: number = 8
): EdgeState {
  const available = getAvailableSpace(center, viewport, padding)
  const needed = radius

  const constrained = {
    top: available.top < needed,
    right: available.right < needed,
    bottom: available.bottom < needed,
    left: available.left < needed,
  }

  const offset: Point = { x: 0, y: 0 }

  if (constrained.left) {
    offset.x = needed - available.left
  } else if (constrained.right) {
    offset.x = -(needed - available.right)
  }

  if (constrained.top) {
    offset.y = needed - available.top
  } else if (constrained.bottom) {
    offset.y = -(needed - available.bottom)
  }

  return {
    constrained,
    available,
    offset,
    isConstrained: constrained.top || constrained.right || constrained.bottom || constrained.left,
  }
}

/**
 * Calculate the optimal angular offset for menu items based on edge constraints
 * This shifts the "center" of the arc away from constrained edges
 */
export function calculateAngularOffset(edgeState: EdgeState): number {
  const { constrained } = edgeState

  // Calculate offset angle based on which edges are constrained
  // The goal is to rotate the arc away from constrained edges
  let offsetAngle = 0

  if (constrained.right && !constrained.left) {
    offsetAngle = Math.PI // Rotate to face left
  } else if (constrained.left && !constrained.right) {
    offsetAngle = 0 // Face right (default)
  } else if (constrained.bottom && !constrained.top) {
    offsetAngle = -Math.PI / 2 // Face up
  } else if (constrained.top && !constrained.bottom) {
    offsetAngle = Math.PI / 2 // Face down
  } else if (constrained.top && constrained.right) {
    offsetAngle = (3 * Math.PI) / 4 // Face bottom-left
  } else if (constrained.top && constrained.left) {
    offsetAngle = Math.PI / 4 // Face bottom-right
  } else if (constrained.bottom && constrained.right) {
    offsetAngle = (-3 * Math.PI) / 4 // Face top-left
  } else if (constrained.bottom && constrained.left) {
    offsetAngle = -Math.PI / 4 // Face top-right
  }

  return offsetAngle
}

/**
 * Clamp a point to stay within viewport bounds
 */
export function clampToViewport(
  point: Point,
  viewport: Viewport,
  padding: number = 0
): Point {
  return {
    x: Math.max(padding, Math.min(viewport.width - padding, point.x)),
    y: Math.max(padding, Math.min(viewport.height - padding, point.y)),
  }
}

/**
 * Get the optimal position for a submenu based on parent position and viewport
 */
export function getSubmenuPosition(
  parentCenter: Point,
  parentRadius: number,
  itemAngle: number,
  submenuRadius: number,
  viewport: Viewport
): Point {
  // Start by placing submenu at the edge of parent in the item's direction
  const distance = parentRadius + submenuRadius * 0.3
  const idealPosition: Point = {
    x: parentCenter.x + Math.cos(itemAngle) * distance,
    y: parentCenter.y + Math.sin(itemAngle) * distance,
  }

  // Check if this position violates edges and adjust
  const edgeState = detectEdgeConstraints(idealPosition, submenuRadius, viewport)

  return {
    x: idealPosition.x + edgeState.offset.x,
    y: idealPosition.y + edgeState.offset.y,
  }
}
